'use strict';


const HttpHeartbeat = require('./httpHeartbeat');
const RedisCluster = require('./redisCluster');


module.exports = {
    HttpHeartbeat: HttpHeartbeat,
    RedisCluster: RedisCluster
};
