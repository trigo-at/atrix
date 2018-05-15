'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, one-var: 0, no-unused-expressions: 0 */


const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const { expect } = require('chai');

const chance = new Chance();

describe('Ustreams', () => {
	let upstreamPort,
		port,
		svc,
		tries = 0;

	beforeEach(async () => {
		tries = 0;
	});

	before(async () => {
		upstreamPort = chance.integer({ min: 10000, max: 20000 });
		const upstream = new atrix.Service('upstream', {
			endpoints: {
				http: {
					port: upstreamPort,
				},
			},
		});

		upstream.endpoints.add('http');

		upstream.handlers.add('GET', '/', (req, reply) => reply({ foo: 'bar' }));
		upstream.handlers.add('GET', '/need-retry', (req, reply) => {
			if (tries++ < 2) {
				throw new Error('try again');
			}
			reply({ foo: 'bar' });
		});
		upstream.handlers.add('GET', '/not-enough', () => { throw new Error('try again'); });
		upstream.handlers.add('GET', '/bad-request', (req, reply) => reply({ foo: 'bar' }).code(400));

		atrix.addService(upstream);
		await atrix.services.upstream.start();

		port = chance.integer({ min: 20001, max: 30000 });
		const service = new atrix.Service('svc', {
			endpoints: {
				http: {
					port,
				},
			},
			upstream: {
				upstream: {
					url: `http://localhost:${upstreamPort}`,
					retry: {
						max_tries: 3,
						interval: 100,
						auto: true,
					},
				},
				ups: {
					url: `http://localhost:${upstreamPort}`,
				},
			},
		});

		service.endpoints.add('http');

		service.handlers.add('GET', '/ups', async (req, reply, s) => {
			const ur = await s.upstream.ups.get('/need-retry');

			reply(ur.body).code(ur.status);
		});
		service.handlers.add('GET', '/', async (req, reply, s) => {
			const ur = await s.upstream.upstream.get('/');

			reply(ur.body).code(ur.status);
		});
		service.handlers.add('GET', '/need-retry', async (req, reply, s) => {
			const ur = await s.upstream.upstream.get('/need-retry');
			reply(ur.body).code(ur.status);
		});
		service.handlers.add('GET', '/not-enough', async (req, reply, s) => {
			const ur = await s.upstream.upstream.get('/not-enough');
			reply(ur.body).code(ur.status);
		});
		service.handlers.add('GET', '/bad-request', async (req, reply, s) => {
			const ur = await s.upstream.upstream.get('/bad-request');

			reply(ur.body).code(ur.status);
		});

		atrix.addService(service);
		await atrix.services.svc.start();
		svc = supertest(`http://localhost:${port}`);
	});

	after(async () => {
		await atrix.services.upstream.stop();
		await atrix.services.svc.stop();
	});

	it('can call upstream', async () => {
		const res = await svc.get('/');
		expect(res.body).to.eql({ foo: 'bar' });
	});

	it('reties configured times', async () => {
		const res = await svc.get('/need-retry');
		expect(res.body).to.eql({ foo: 'bar' });
	});

	it('gives up after configured times', async () => {
		try {
			await svc.get('/not-enough');
			throw new Error('this should have thrown');
		} catch (e) {} //eslint-disable-line
	});

	it('can call upstream without retry settings', async () => {
		const res = await svc.get('/ups');
		expect(res.statusCode).to.eql(500);
	});

	it('upstrema returns retuls with statiscode <= 500', async () => {
		const res = await svc.get('/bad-request');
		expect(res.statusCode).to.eql(400);
	});
});
