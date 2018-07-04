'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();

describe('logger-cfg', () => {
	let svc;
	let service;
	before(async () => {
		const port = chance.integer({ min: 20000, max: 30000 });
		service = new atrix.Service('logger', {
			logger: {
				level: 'debug',
				name: 'franz',
				streams: [{
					stream: process.stdout,
				}, {
					path: './logger-test.log',
					level: 'error',
				}],
			},
			endpoints: {
				http: {
					port,
					handlerDir: `${__dirname}/logger-cfg`,
				},
			},
			settings: {
				test: {
					key: 'value',
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

	it('applies logger configuration', async() => {
		const res = await svc.get('/');
		expect(res.statusCode).to.equal(200);
		expect(res.body).to.eql({
			test: {
				key: 'value',
			},
		});
	});
});
