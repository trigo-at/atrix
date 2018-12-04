'use strict';

const atrix = require('../..');
const config = require('./config');

const service = atrix.addService(config);

service.handlers.add('GET', '/jwt', (req, reply) => reply({foo: 'bar'}));
service.handlers.add('GET', '/signedlink', (req, reply) => reply({foo: 'bar'}));

service.handlers.add('GET', '/test', (req, reply) => reply({foo: 'bar'}));

module.exports = service;
