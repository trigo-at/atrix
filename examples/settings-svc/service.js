'use strict';

const atrix = require('../..');

const service = atrix.addService({
	name: 'settings',
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

module.exports = service;
