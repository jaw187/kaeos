'use strict';


const Code = require('code');
const Fs = require('fs');
const Hapi = require('hapi');
const Lab = require('lab');
const Net = require('net');
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

            expect(err).to.not.exist();

            const monitors = [
                {
                    agent: {
                        name: 'HttpHeartbeat',
                        settings: {
                            url: `${server.info.uri}/heartbeat`,
                            interval: 5,
                            attempts: 1
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

                            server.start((err) => {

                                expect(err).to.not.exist();

                                const waitAgain = () => {

                                    kaeos.stop();
                                    console.log = originalConsoleLog;
                                    done();
                                };

                                setTimeout(waitAgain, 25);
                            });
                        };

                        setTimeout(wait, 25);
                    });
                });
            });
        });
    });

    it('runs redis agent', (done) => {

        const originalConsoleLog = console.log;
        console.log = () => {

            return null;
        };

        const response = Fs.readFileSync('./test/redisResponse.txt', 'ascii');
        const server = Net.createServer((socket) => {

            socket.write(response);
        });
        server.listen();

        server.on('listening', () => {

            const monitors = [
                {
                    agent: {
                        name: 'RedisCluster',
                        settings: {
                            host: server.address().address,
                            port: server.address().port,
                            interval: 5,
                            attempts: 1,
                            minClusterSize: 3,
                            minReplicasPerMaster: 1,
                            maxMemory: 8000000
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

                const wait = () => {

                    server.close(() => {

                        const waitAgain = () => {

                            kaeos.stop();
                            console.log = originalConsoleLog;
                            return done();
                        };
                        setTimeout(waitAgain, 25);
                    });
                };
                setTimeout(wait, 25);
            });
        });
    });
});
