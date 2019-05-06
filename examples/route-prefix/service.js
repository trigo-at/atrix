'use strict';

const atrix = require('../..');

const service = atrix.addService({
    name: 'routeprefix',
    endpoints: {
        http: {
            port: 3336,
            handlerDir: `${__dirname}/handlers`,
            prefix: '/events/api',
        },
    },
    settings: {
        test: {
            key: 'value',
        },
    },
});

module.exports = service;
