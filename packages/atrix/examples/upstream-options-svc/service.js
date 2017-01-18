'use strict';

const atrix = require('../..');
const config = require('./config');

const service = new atrix.Service('upstreamoptions', config);

service.endpoints.add('http');


service.handlers.add('GET', '/data', (req, reply) => {
	service.upstream.options.get('/data').then(result => {
		return reply({ requests: result.body });
	});
});

module.exports = service;
