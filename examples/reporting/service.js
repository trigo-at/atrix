'use strict';
const atrix = require('atrix');

var reportingSvc = new atrix.Service('reporting', require('./config'));
reportingSvc.endpoints.add('http');
reportingSvc.handlers.add('GET', '/tickets', (req, reply) => {
	return reply({ status: 'OK' });
});

module.exports = reportingSvc;
