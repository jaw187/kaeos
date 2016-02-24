'use strict';


const ConsoleReporter = require('./console');
const Pagerduty = require('./pagerduty');


module.exports = {
    Console: ConsoleReporter,
    Pagerduty: Pagerduty
};
