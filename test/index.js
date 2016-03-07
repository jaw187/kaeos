'use strict';


const Code = require('code');
const Lab = require('lab');
const Kaeos = require('../lib');


const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Keep An Eye On Shit', () => {

    it('runs', (done) => {

        const monitors = [
            {
                agent: {
                    name: 'HttpHeartbeat',
                    settings: {
                        url: 'http://google.com',
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
        kaeos.start();
        done();
    });
});
