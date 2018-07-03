'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

// const svc = require('./services').loadFromDir;
// const expect = require('chai').expect;
const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();

describe('service.request() interface', () => {
	let svc;
	let service;
	before(async () => {
		const port = chance.integer({ min: 20000, max: 30000 });
		service = new atrix.Service('serviceRequest', {
			endpoints: {
				http: {
					port,
					handlerDir: `${__dirname}/load-handlers-from-dir`,
					cors: true,
					requestLogger: {
						enabled: false,
						logFullRequest: true,
						logFullResponse: true,
					},
				},
			} });
		service.endpoints.add('http');
		atrix.addService(service);
		await service.start();
		svc = supertest(`http://localhost:${port}`);
	});

	after(async () => {
		await service.stop();
	});

	it('returns headers', async() => {
		const res = await svc.get('/service-request');
		expect(res.body.headers).to.be.an('object');
	});
	it('returns statusCode', async() => {
		const res = await svc.get('/service-request');
		expect(res.body.statusCode).to.equal(200);
	});
	it('returns result', async() => {
		const res = await svc.get('/service-request');
		expect(res.body.result).to.eql({ res: 'POST /{id}' });
	});
	it('returns statusMessage', async() => {
		const res = await svc.get('/service-request');
		expect(res.body.statusMessage).to.eql('OK');
	});
	it('returns payload', async() => {
		const res = await svc.get('/service-request');
		expect(res.body.payload).to.eql('{"res":"POST /{id}"}');
	});
	it('returns rawPayload', async() => {
		const res = await svc.get('/service-request');
		expect(new Buffer(res.body.rawPayload).toString()).to.equal('{"res":"POST /{id}"}');
	});
});
