'use strict';
const atrix = require('@trigo/atrix');
const service = new atrix.Service('brokenupstream', require('./config'));

service.endpoints.add('http');
service.handlers.add('GET', '/data', (req, reply) => {
	service.upstream.broken.get('/data').then(result => {
		console.log(result);
		return reply({ requests: result.body });
	});
});

module.exports = service;
