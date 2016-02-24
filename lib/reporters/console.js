'use strict';


const internals = {};


module.exports = internals.Reporter = function () {

};


internals.Reporter.prototype.fail = function (message) {

    console.log(message + ' is down');
};


internals.Reporter.prototype.success = function (message) {

    console.log(message + ' is up');
};
