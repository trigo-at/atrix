'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, one-var: 0, no-unused-expressions: 0 */


const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const { expect } = require('chai');

const chance = new Chance();

describe('Upstreams', () => {
	let svc,
		tries = 0,
		service;

	beforeEach(async () => {
		tries = 0;
	});

	before(async () => {
		const upstreamPort = chance.integer({ min: 10000, max: 20000 });
		const upstream = new atrix.Service('upstream', {
			endpoints: {
				http: {
					port: upstreamPort,
				},
			},
		});

		upstream.endpoints.add('http');
		upstream.handlers.add('*', '/echo', (req, reply) => {
			reply(req.payload);
		});
		upstream.handlers.add('GET', '/', (req, reply) => reply({ foo: 'bar' }));
		upstream.handlers.add('GET', '/need-retry', (req, reply) => {
			if (tries++ < 2) {
				throw new Error('try again');
			}
			reply({ foo: 'bar' });
		});
		upstream.handlers.add('GET', '/not-enough', () => { throw new Error('try again'); });
		upstream.handlers.add('GET', '/bad-request', (req, reply) => reply({ foo: 'bar' }).code(400));

		upstream.handlers.add('GET', '/headers', (req, reply) => reply({ headers: req.headers }));

		upstream.handlers.add('POST', '/echo-query-params', async (req, reply) => {
			reply(req.query);
		});
		atrix.addService(upstream);
		await atrix.services.upstream.start();

		const port = chance.integer({ min: 20001, max: 30000 });
		service = new atrix.Service('svc', {
			endpoints: {
				http: {
					port,
				},
			},
			upstream: {
				upstream: {
					url: `http://localhost:${upstreamPort}`,
					options: {
						headers: {
							'User-Agent': 'AtrixUpstream',
						},
					},
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

		service.handlers.add('POST', '/gibts-ned', async (req, reply, s) => {
			const ur = await s.upstream.upstream.post('/iaaa', { payload: req.payload });
			reply(ur.body).code(ur.status);
		});

		service.handlers.add('POST', '/mit-query-params', async (req, reply, s) => {
			const ur = await s.upstream.upstream.post('/echo-query-params', { queryParams: req.query });
			reply(ur.body);
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

	it('result is formated correctly', async () => {
		const res = await svc.get('/');
		expect(res.body).to.exist;
	});

	it('result has a status code', async () => {
		const res = await svc.get('/');
		expect(res.statusCode).to.eql(200);
	});

	it('result has a body', async () => {
		const res = await svc.get('/');
		expect(res.body).to.eql({ foo: 'bar' });
	});

	it('return 404 from upstream', async () => {
		const res = await svc.post('/gibts-ned').send({ test: 'test' });
		expect(res.status).to.eql(404);
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

	it('upstream returns result with statiscode <= 500', async () => {
		const res = await svc.get('/bad-request');
		expect(res.statusCode).to.eql(400);
	});

	it('ignores body on GET request', async () => {
		const response = await service.upstream.upstream.get('/echo', { payload: { pika: 'chu' } });
		expect(response.statusCode).to.eql(200);
		expect(response.body).to.be.not.ok;
	});

	it('ignores body on HEAD request', async () => {
		const response = await service.upstream.upstream.head('/echo', { payload: { pika: 'chu' } });
		expect(response.statusCode).to.eql(200);
		expect(response.body).to.be.not.ok;
	});

	it('accepts body on OPTIONS request', async () => {
		const body = { pika: 'chu' };
		const response = await service.upstream.upstream.options('/echo', { payload: body });
		expect(response.statusCode).to.eql(200);
		expect(response.body).to.eql(body);
	});

	it('accepts body on DELETE request', async () => {
		const body = { pika: 'chu' };
		const response = await service.upstream.upstream.delete('/echo', { payload: body });
		expect(response.statusCode).to.eql(200);
		expect(response.body).to.eql(body);
	});

	it('accepts body on POST request', async () => {
		const body = { pika: 'chu' };
		const response = await service.upstream.upstream.post('/echo', { payload: body });
		expect(response.statusCode).to.eql(200);
		expect(response.body).to.eql(body);
	});

	it('accepts body on PUT request', async () => {
		const body = { pika: 'chu' };
		const response = await service.upstream.upstream.put('/echo', { payload: body });
		expect(response.statusCode).to.eql(200);
		expect(response.body).to.eql(body);
	});

	it('accepts body on PATCH request', async () => {
		const body = { pika: 'chu' };
		const response = await service.upstream.upstream.patch('/echo', { payload: body });
		expect(response.statusCode).to.eql(200);
		expect(response.body).to.eql(body);
	});

	it('POST request works without body', async () => {
		const response = await service.upstream.upstream.post('/echo');
		expect(response.statusCode).to.eql(200);
		expect(response.body).to.eql({});
	});

	it('PUT request works without body', async () => {
		const response = await service.upstream.upstream.put('/echo');
		expect(response.statusCode).to.eql(200);
		expect(response.body).to.eql({});
	});

	it('PATCH request works without body', async () => {
		const response = await service.upstream.upstream.patch('/echo');
		expect(response.statusCode).to.eql(200);
		expect(response.body).to.eql({});
	});

	it('sets headers defined in upstream config', async () => {
		const response = await service.upstream.upstream.get('/headers');
		expect(response.statusCode).to.eql(200);
		expect(response.body.headers['user-agent']).to.equal('AtrixUpstream');
	});

	it('sets headers in request options', async () => {
		const response = await service.upstream.upstream.get('/headers', { options: { headers: { 'x-pokemon': 'Pikachu' } } });
		expect(response.statusCode).to.eql(200);
		expect(response.body.headers['x-pokemon']).to.equal('Pikachu');
	});

	it('overwrites config headers with options headers', async () => {
		const response = await service.upstream.upstream.get('/headers', { options: { headers: { 'User-Agent': 'Pikachu' } } });
		expect(response.statusCode).to.eql(200);
		expect(response.body.headers['user-agent']).to.equal('Pikachu');
	});

	it('headers are case insensitive', async () => {
		const mixedCaseResponse = await service.upstream.upstream.get('/headers', { options: { headers: { 'User-Agent': 'Pikachu' } } });
		const lowercaseResponse = await service.upstream.upstream.get('/headers', { options: { headers: { 'user-agent': 'Pikachu' } } });
		expect(mixedCaseResponse.body.headers['user-agent']).to.eql(lowercaseResponse.body.headers['user-agent']);
	});

	it('handles queryParams', async () => {
		const res = await svc.post('/mit-query-params').query({ a: '42', b: '12' });
		expect(res.body).to.eql({ a: '42', b: '12' });
	});
});
