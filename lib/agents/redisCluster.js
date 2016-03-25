'use strict';


const Hoek = require('hoek');
const Joi = require('joi');
const Net = require('net');


const internals = {
    description: {
        name: 'Redis Cluster'
    },
    schema: {
        interval: Joi.number().default(60 * 1000),
        port: Joi.number().integer().max(65535).required(),
        host: Joi.alternatives(Joi.string().ip(), Joi.string().hostname()),
        reporter: Joi.object().required(),
        attempts: Joi.number().integer().default(2),
        minClusterSize: Joi.number().integer().min(3),
        minReplicasPerMaster: Joi.number().integer().min(1).required(),
        maxMemory: Joi.number().integer().required()
    },
    clusterState: /cluster_state:(\w+)/,
    clusterSize: /cluster_size:(\d+)/,
    nodes: /([\d\w]+) (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}) (|myself,)(slave|master) ([\d\w]+|-) \d+ \d+ \d+ \w+( [\d-]+|)/g,
    memory: /memory:(\d+)/
};


module.exports = internals.RedisCluster = function (settings) {

    const validation = Joi.validate(settings, internals.schema);
    Hoek.assert(validation.error === null, 'Invalid settings ' + (validation.error && validation.error.annotate()));
    this.settings = validation.value;

    this._status = -1;
    this.failures = 0;
    this.successes = 0;
};


internals.RedisCluster.prototype.status = function () {

    return {
        name: this.settings.url,
        status: this._status
    };
};


internals.RedisCluster.prototype.start = function (callback) {

    const baseMessage = internals.description.name + ': ' + this.settings.host + ':' + this.settings.port;
    const reporter = this.settings.reporter;

    const test = () => {

        this.test((err) => {

            if (err) {
                this._status = 0;
                this.successes = 0;
                if (++this.failures === this.settings.attempts) {
                    return reporter.fail(baseMessage, (err, reporter_id) => {

                        if (err) {
                            this._status = -1;
                        }

                        this.reporter_id = reporter_id;
                    });
                }
            }

            if (!err) {
                this._status = 1;
                this.failures = 0;

                if (++this.successes === this.settings.attempts) {
                    reporter.success(baseMessage, this.reporter_id, () => {

                        delete this.reporter_id;
                    });
                }
            }
        });
    };

    this.interval = setInterval(test, this.settings.interval);
};


internals.RedisCluster.prototype.stop = function () {

    clearInterval(this.interval);
};


internals.RedisCluster.prototype.test = function (callback) {

    const client = new Net.Socket();
    client.connect(this.settings.port, this.settings.host, (err) => {

        if (err) {
            return;
        }

        client.write('CLUSTER INFO\r\nCLUSTER NODES\r\nINFO\r\nPING\r\n');
    });

    client.on('error', (err) => {

        return callback(err);
    });

    const errors = [];
    let response = '';
    client.on('data', (data) => {

        response += data;
        if (data.indexOf('+PONG') !== -1) {

            client.destroy();

            // Check the cluster state
            let regexArray = internals.clusterState.exec(response);
            if (regexArray === null || regexArray[1] !== 'ok') {
                errors.push('cluster_state is not valid');
            }

            // Check the cluster size
            regexArray = internals.clusterSize.exec(response);
            if (regexArray === null || parseInt(regexArray[1]) < this.settings.minClusterSize) {
                errors.push('cluster_size is not valid or sufficient');
            }

            // Check the minimum replicas per master
            const nodes = [];
            while ((regexArray = internals.nodes.exec(response)) !== null) {

                const node = {
                    id: regexArray[1],
                    url: regexArray[2],
                    status: regexArray[4],
                    slaveOf: regexArray[5]
                };

                if (node.status === 'master') {
                    node.hashRange = regexArray[6].trim();
                };

                nodes.push(node);
            }

            if (nodes.length === 0) {
                errors.push('No nodes in cluster');
            }

            const masterNodes = nodes.filter((node) => node.status === 'master');
            masterNodes.forEach((masterNode) => {

                const slaveNodes = nodes.filter((node) => node.slaveOf === masterNode.id);
                if (slaveNodes.length < this.settings.minReplicasPerMaster) {
                    errors.push(`Master node (${masterNode.id}) only has ${slaveNodes.length} slaves when we were expecting ${this.settings.minReplicasPerMaster}`);
                }
            });

            // Check the memory
            regexArray = internals.memory.exec(response);
            if (regexArray === null || parseInt(regexArray[1]) >= this.settings.maxMemory) {
                errors.push('memory of connected node is beyond threshold');
            }

            return callback(errors.length > 0 ? new Error(errors) : undefined);
        }
    });
};
