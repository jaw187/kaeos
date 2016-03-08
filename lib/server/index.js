'use strict';


const Hapi = require('hapi');


const internals = {};


module.exports = internals.Server = function (monitors, port) {

    this.server = new Hapi.Server();
    this.server.connection({ port: port });

    this.start = (callback) => {

        this.server.start((err) => {

            return callback(err);
        });
    };

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
