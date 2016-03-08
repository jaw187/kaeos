# kaeos
Keep An Eye On Shit

## Install
```
npm install kaeos
```

## Usage
```javascript
const Kaeos = require('kaeos');


const internals = {};


internals.main = function () {

    const options = {
        monitors: [
            {
                agent: {
                    name: 'HttpHeartbeat',
                    settings: {
                        url: 'http://somehost/heartbeat',
                    }
                },
                reporter: {
                    name: 'Console'
                }
            },
        ],
        connection: {}
    };

    const kaeos = new Kaeos(options);
    kaeos.start();
};


internals.main();
```
