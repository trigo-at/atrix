'use strict';

const atrix = require('../..');
require('../../examples');

const supertest = require('supertest');

const svcs = {};

Object.keys(atrix.services).forEach(serviceName => {
	const svc = atrix.services[serviceName];
	if (svc.config.config.endpoints.http) {
		svcs[svc.name] = supertest(
			`http://localhost:${svc.config.config.endpoints.http.port}`
		);
	}
});

module.exports = svcs;
