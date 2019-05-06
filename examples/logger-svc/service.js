'use strict';

const atrix = require('../..');

const service = atrix.addService({
    name: 'logger',
    logger: {
        level: 'debug',
        name: 'franz',
        streams: [
            {
                stream: process.stdout,
            },
            {
                path: './logger-test.log',
                level: 'error',
            },
        ],
    },
    endpoints: {
        http: {
            port: 3339,
            handlerDir: `${__dirname}/handlers`,
        },
    },
    settings: {
        test: {
            key: 'value',
        },
    },
});

module.exports = service;
