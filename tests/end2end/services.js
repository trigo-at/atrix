'use strict';

const atrix = require('../..');
const testServices = require('../../examples/');
const supertest = require('supertest');

const svcs = {};
for (const i in atrix.services) {
	const svc = atrix.services[i];
	if (svc.config.config.endpoints.http) {
		svcs[svc.name] = supertest(`http://localhost:${svc.config.config.endpoints.http.port}`);
	}
}

module.exports = svcs;
