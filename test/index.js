'use strict';


const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Vision = require('vision');
const Kaeos = require('../lib');


const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Keep An Eye On Shit', () => {

    it('fails to load without settings', (done) => {

        const thrower = () => {

            new Kaeos();
        };

        expect(thrower).to.throw();
        done();
    });

    it('fails to load with improper settings', (done) => {

        const thrower = () => {

            new Kaeos({ monitors: 'foobar' });
        };

        expect(thrower).to.throw();
        done();
    });

    it('loads server without plugins', (done) => {

        const monitors = [
            {
                agent: {
                    name: 'HttpHeartbeat',
                    settings: {
                        url: 'http://foo.bar',
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
            monitors: monitors,
            server: {}
        };

        const kaeos = new Kaeos(options);
        kaeos.start((err) => {

            expect(err).to.not.exist();
            kaeos.stop();
            done();
        });
    });

    it('handles error from server plugin registration', (done) => {

        const badplugin = {
            register: function (server, options, next) {

                return next(new Error('foobar'));
            }
        };

        badplugin.register.attributes = {
            name: 'foo',
            version: '1.0.0'
        };

        const monitors = [
            {
                agent: {
                    name: 'HttpHeartbeat',
                    settings: {
                        url: 'http://foo.bar',
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
            monitors: monitors,
            server: {
                plugins: [badplugin]
            }
        };

        const kaeos = new Kaeos(options);
        kaeos.start((err) => {

            expect(err).to.exist();
            kaeos.stop();
            done();
        });
    });

    it('runs', (done) => {

        const originalConsoleLog = console.log;
        console.log = () => {

            return null;
        };

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
                            interval: 5
                        }
                    },
                    reporter: {
                        name: 'Console',
                        settings: {}
                    }
                }
            ];

            const options = {
                monitors: monitors,
                server: {
                    plugins: Vision
                }
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

                    server.stop((err) => {

                        expect(err).to.not.exist();

                        const wait = () => {

                            kaeos.stop();
                            console.log = originalConsoleLog;
                            done();
                        };

                        setTimeout(wait, 25);
                    });
                });
            });
        });
    });
});
