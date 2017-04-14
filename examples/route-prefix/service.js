'use strict';

const atrix = require('../..');

const service = new atrix.Service('routeprefix', {
	endpoints: {
		http: {
			port: 3336,
			handlerDir: `${__dirname}/handlers`,
			prefix: '/events/api',
		},
	},
	settings: {
		test: {
			key: 'value',
		},
	},
});

service.endpoints.add('http');

module.exports = service;
