'use strict';


const Handlebars = require('handlebars');


module.exports.register = (server, options, next) => {

    server.views({
        engines: { html: Handlebars },
        path: `${__dirname}/templates`
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, reply) => {

            server.inject({ method: 'GET', url: '/status' }, (res) => {

                return reply.view('index', { monitors: res.result });
            });
        }
    });

    return next();
};

module.exports.register.attributes = {
    name: 'example',
    version: '1.0.0'
};
