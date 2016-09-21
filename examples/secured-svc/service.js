'use strict';
const atrix = require('../../');

var service = new atrix.Service('secured', require('./config'));

service.endpoints.add('http');

service.handlers.add('GET', '/data', (req, reply) => {
	return reply({ foo: 'bar' });
});

service.handlers.add('GET', '/test', (req, reply) => {
	return reply({ foo: 'bar' });
});

module.exports = service;
