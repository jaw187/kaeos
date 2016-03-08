'use strict';


const Hoek = require('hoek');
const Joi = require('joi');
const Wreck = require('wreck');


const internals = {};


internals.description = {
    name: 'HTTP Heartbeat'
};


internals.schema = {
    interval: Joi.number().default(60 * 1000),
    url: Joi.string().uri().required(),
    result: Joi.object().default({ status: 'ok' }),
    wreckOptions: Joi.object().default({}),
    reporter: Joi.object().required(),
    attempts: Joi.number().default(3)
};


module.exports = internals.Heartbeat = function (settings) {

    const validation = Joi.validate(settings, internals.schema);
    Hoek.assert(validation.error === null, 'Invalid settings ' + (validation.error && validation.error.annotate()));
    this.settings = validation.value;

    this._status = -1;
    this.failures = 0;
    this.successes = 0;

    this.wreck = Wreck.defaults({
        headers: {
            'kaeos-source': 'http-heartbeat'
        }
    });
};


internals.Heartbeat.prototype.status = function () {

    return {
        name: this.settings.url,
        status: this._status
    };
};


internals.Heartbeat.prototype.start = function (callback) {

    const baseMessage = internals.description.name + ': ' + this.settings.url;
    const reporter = this.settings.reporter;

    const test = () => {

        this.test((err) => {

            if (err) {
                this._status = 0;
                this.successes = 0;
                if (++this.failures === this.settings.attempts) {
                    return reporter.fail(baseMessage, (err, reporter_id) => {

                        if (err) {
                            this._status = -1;
                        }

                        this.reporter_id = reporter_id;
                    });
                }
            }

            if (!err) {
                this._status = 1;
                this.failures = 0;

                if (++this.successes === this.settings.attempts && this.reporter_id) {
                    reporter.success(baseMessage, this.reporter_id, () => {

                        delete this.reporter_id;
                    });
                }
            }
        });
    };

    this.interval = setInterval(test, this.settings.interval);
};


internals.Heartbeat.prototype.stop = function () {

    clearInterval(this.interval);
};


internals.Heartbeat.prototype.test = function (callback) {

    const defaults = {
        timeout: 2000,
        rejectUnauthorized: false,
        json: 'forse'
    };

    const options = Hoek.applyToDefaults(defaults, this.settings.wreckOptions);

    this.wreck.get(this.settings.url, options, (err, res, payload) => {

        if (err) {
            return callback(err);
        }

        if (res.statusCode !== 200) {
            return callback(new Error(res.statusCode + ' response code received'));
        }

        if (!Hoek.deepEqual(this.settings.result, payload)) {
            return callback(new Error('Unexpected response'));
        }

        return callback();
    });
};
