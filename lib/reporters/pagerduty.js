'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
const Wreck = require('wreck');


const internals = {};


internals.schema = {
    key: Joi.string().required(),
    token: Joi.string().required(),
};


internals.url = 'https://events.pagerduty.com/generic/2010-04-15/create_event.json';


module.exports = internals.Reporter = function (settings) {

    const validation = Joi.validate(settings, internals.schema);
    Hoek.assert(validation.error === null, 'Invalid settings ' + (validation.error && validation.error.annotate()));

    this.settings = validation.value;

    this.headers = {
        Authorization: 'Token token=' + this.settings.token
    };

    this.basePayload = {
        service_key: this.settings.key
    };
};


internals.Reporter.prototype.fail = function (description, callback) {

    const payload = Hoek.clone(this.basePayload);
    payload.event_type = 'trigger';
    payload.description = description + ' is down';

    const options = {
        payload: JSON.stringify(payload),
        json: 'forse'
    };

    Wreck.post(internals.url, options, (err, res, result) => {

        return callback(err, result && result.incident_key);
    });
};


internals.Reporter.prototype.success = function (description, incident_key, callback) {

    const payload = Hoek.clone(this.basePayload);
    payload.description = description + ' is up';
    payload.event_type = 'resolve';
    payload.incident_key = incident_key;

    const options = {
        payload: JSON.stringify(payload),
        json: 'forse'
    };

    Wreck.post(internals.url, options, (err, res, result) => {

        return callback(err, res && res.statusCode)
    })
};
