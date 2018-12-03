'use strict';

const atrix = require('../..');
const config = require('./config');

// console.log(atrix)
const service = atrix.addService(config);

service.handlers.add('GET', '/data', (req, reply) => {
	service.upstream.reporting.get('/data').then(result => {
		return reply({ requests: result.body });
	});
});

module.exports = service;
