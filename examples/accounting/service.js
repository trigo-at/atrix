'use strict';
const atrix = require('atrix');

var service = new atrix.Service('accounting', require('./config'));

service.endpoints.add('http');
service.handlers.add('GET', '/requests', (req, reply) => {
	service.upstream.reporting.get('/tickets').then(result => {
		return reply({ requests: result.body });
	});
});

module.exports = service;
