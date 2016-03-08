'use strict';


const Hapi = require('hapi');
const Vision = require('vision');
const Kaeos = require('../lib');
const Plugin = require('./plugin');


// Just a server to monitor
const server = new Hapi.Server();
server.connection({ host: 'localhost' });
server.route({ method: 'GET', path: '/heartbeat', handler: (request, reply) => reply({ status: 'ok' }) });
server.start((err) => {

    if (err) {
        throw err;
    }

    const stop = () => {

        server.stop((err) => {

            if (err) {
                throw err;
            }
        });
    };

    setTimeout(stop, 10 * 1000);


//      KAEOS


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
        monitors: monitors,
        server: {
            plugins: [Vision, Plugin]
        }
    };

    const kaeos = new Kaeos(options);
    kaeos.start((err) => {

        if (err) {
            throw err;
        }

        console.log(`

Keep An Eye On Shit

        .           ..         .           .       .           .           .
              .         .            .          .       .
                    .         ..xxxxxxxxxx....               .       .             .
            .             MWMWMWWMWMWMWMWMWMWMWMWMW                       .
                      IIIIMWMWMWMWMWMWMWMWMWMWMWMWMWMttii:        .           .
         .      IIYVVXMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWxx...         .           .
             IWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMx..
           IIWMWMWMWMWMWMWMWMWBY%ZACH%AND%OWENMWMWMWMWMWMWMWMWMWMWMWMWMx..        .
            ""MWMWMWMWMWM"""""""".  .:..   ."""""MWMWMWMWMWMWMWMWMWMWMWMWMWti.
         .     ""   . '  .: . :. : .  . :.  .  . . .  """"MWMWMWMWMWMWMWMWMWMWMWMWMti=
                . .   :' . :   .  .'.' '....xxxxx...,'. '   ' ."""YWMWMWMWMWMWMWMWMWMW+
             ; . ' .  . : . .' :  . ..XXXXXXXXXXXXXXXXXXXXx.    '     . "YWMWMWMWMWMWMW
        .    .  .  .    . .   .  ..XXXXXXXXWWWWWWWWWWWWWWWWXXXX.  .     .     """""""
                ' :  : . : .  ...XXXXXWWW"   W88N88@888888WWWWWXX.   .   .       . .
           . ' .    . :   ...XXXXXXWWW"    M88N88GGGGGG888^8M "WMBX.          .   ..  :
                 :     ..XXXXXXXXWWW"     M88888WWRWWWMW8oo88M   WWMX.     .    :    .
                   "XXXXXXXXXXXXWW"       WN8888WWWWW  W8@@@8M    BMBRX.         .  : :
          .       XXXXXXXX=MMWW":  .      W8N888WWWWWWWW88888W      XRBRXX.  .       .
             ....  ""XXXXXMM::::. .        W8@889WWWWWM8@8N8W      . . :RRXx.    .
                 ''...'''  MMM::.:.  .      W888N89999888@8W      . . ::::"RXV    .  :
         .       ..'''''      MMMm::.  .      WW888N88888WW     .  . mmMMMMMRXx
              ..' .            ""MMmm .  .       WWWWWWW   . :. :,miMM"""  : ""'    .
           .                .       ""MMMMmm . .  .  .   ._,mMMMM"""  :  ' .  :
                       .                  ""MMMMMMMMMMMMM""" .  : . '   .        .
                  .              .     .    .                      .         .
        .                                         .          .         .



    `);
    });
});
