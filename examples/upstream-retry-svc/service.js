'use strict';
const atrix = require('@trigo/atrix');

var service = new atrix.Service('upstreamretry', require('./config'));

service.endpoints.add('http');


service.handlers.add('GET', '/data', (req, reply) => {
	service.upstream.retrydemo.retry.get('/data').then(result => {
		return reply({ requests: result.body });
	});
});

module.exports = service;
