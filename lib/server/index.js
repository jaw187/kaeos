'use strict';


const Hapi = require('hapi');


const internals = {};


module.exports = internals.Server = function (monitors, options) {

    this.server = new Hapi.Server();
    this.server.connection({ port: options.port });

    this.start = (callback) => {

        if (options.plugins) {
            return this.server.register(options.plugins, (err) => {

                if (err) {
                    return callback(err);
                }

                this.server.start((err) => callback(err));
            });
        }

        this.server.start((err) => callback(err));
    };

    this.inject = (injectOptions, callback) => this.server.inject(injectOptions, callback);

    this.server.route({
        method: 'GET',
        path: '/status',
        handler: (request, reply) => {

            const statuses = [];

            monitors.map((monitor) => {

                statuses.push(monitor.status());
            });

            return reply(statuses);
        }
    });
};
