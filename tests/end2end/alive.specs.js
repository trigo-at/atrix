'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();

describe('every service instance', () => {
	let svc;
	let service;
	before(async () => {
		const port = chance.integer({ min: 20000, max: 30000 });
		service = new atrix.Service('downstream', {
			service: {
			},
			endpoints: {
				http: {
					port,
				},
			},
			upstream: {
				reporting: {
					url: 'http://localhost:3001',
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

	describe('/alive', () => {
		it('should have alive endpoint returning 200 if everything is ok', (done) => {
			svc.get('/alive').expect(200, done);
		});

		it.skip('should return 207 if some upstream service are not available', (done) => {
			svc.brokenupstream.get('/alive').expect(207, done);
		});

		it.skip('should reflect upstream service status in response', (done) => {
			svc.brokenupstream.get('/alive').expect(207).end((err, res) => {
				expect(res.body.upstreams[0].result).to.have.property('error');
				done();
			});
		});
	});

	describe('service endpoints', () => {
		it('should return 503 service unavailable if required upstream is not reachable');
	});
});
