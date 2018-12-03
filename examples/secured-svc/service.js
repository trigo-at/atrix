'use strict';

const atrix = require('../..');
const config = require('./config');

const service = atrix.addService(config);

service.handlers.add('GET', '/data', (req, reply) => {
	return reply({ foo: 'bar' });
});

service.handlers.add('GET', '/test', (req, reply) => {
	return reply({ foo: 'bar' });
});

module.exports = service;
