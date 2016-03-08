# kaeos
Keep An Eye On Shit

## Example
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
                        url: 'http://localhost/heartbeat',
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
