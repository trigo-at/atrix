'use strict';

const atrix = require('../..');
const config = require('./config');

const service = atrix.addService(config);

service.handlers.add('GET', '/data', (req, reply) => {
    service.upstream.basicAuth.get('/data').then(result => reply({requests: result.body}));
    service.upstream.oAuth.get('/data').then(result => reply({requests: result.body}));
});

module.exports = service;
