'use strict';

const R = require('ramda');

class Basic {
    constructor(config) {
        this.username = config.username;
        this.secret = config.secret;
    }

    authorize(fetchOptions) {
        const options = R.clone(fetchOptions);
        options.headers = fetchOptions.headers || {};
        options.auth = {
            username: this.username,
            password: this.secret,
        };
        return Promise.resolve(options);
    }
}

module.exports = Basic;
