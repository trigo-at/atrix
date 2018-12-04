'use strict';

const atrix = require('../..');
const config = require('./config');

const service = atrix.addService(config);

service.handlers.add('GET', '/data', (req, reply) => {
    service.upstream.reporting.get('/data').then(result => reply({requests: result.body}));
});

module.exports = service;
