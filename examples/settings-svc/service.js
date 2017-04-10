'use strict';

const atrix = require('../..');

const service = new atrix.Service('settings', {
	endpoints: {
		http: {
			port: 3335,
			handlerDir: `${__dirname}/handlers`,
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
