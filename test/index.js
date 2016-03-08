'use strict';


const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Kaeos = require('../lib');


const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Keep An Eye On Shit', () => {

    it('runs', (done) => {

        // Just a server to monitor
        const server = new Hapi.Server();
        server.connection({ host: 'localhost' });
        server.route({ method: 'GET', path: '/heartbeat', handler: (request, reply) => reply({ status: 'ok' }) });
        server.start((err) => {

            if (err) {
                throw err;
            }

            const monitors = [
                {
                    agent: {
                        name: 'HttpHeartbeat',
                        settings: {
                            url: `${server.info.uri}/heartbeat`,
                            interval: 2000
                        }
                    },
                    reporter: {
                        name: 'Console',
                        settings: {}
                    }
                }
            ];

            const options = {
                monitors: monitors
            };

            const kaeos = new Kaeos(options);
            kaeos.start((err) => {

                expect(err).to.not.exist();
                expect(kaeos.server).to.exist();

                kaeos.server.inject({
                    method: 'GET',
                    url: '/status'
                }, (res) => {

                    expect(res).to.exist();
                    expect(res.statusCode).to.equal(200);
                    expect(res.result).to.exist();
                    expect(res.result[0]).to.exist();
                    expect(res.result[0].name).to.exist();
                    expect(res.result[0].status).to.exist();
                    done();
                });
            });
        });
    });
});
