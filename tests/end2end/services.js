'use strict';
const atrix = require('../..');
const testServices = require('../../examples/');
const supertest = require('supertest');

var svcs = {};
for (let i in atrix.services) {
	let svc = atrix.services[i];
	if (svc.config.config.endpoints.http) {
		svcs[svc.name] = supertest(`http://localhost:${svc.config.config.endpoints.http.port}`);
	}
}

module.exports = svcs;
