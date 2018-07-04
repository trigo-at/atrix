'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */
const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();

describe('loading handlers from fs', () => {
	let svc;
	let service;
	before(async () => {
		const port = chance.integer({ min: 20000, max: 30000 });
		service = new atrix.Service('loadFromDir', {
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

	it('loaded GET /', async() => {
		const res = await svc.get('/');
		expect(res.statusCode).to.equal(200);
		expect(res.body.res).to.eql('GET /');
	});

	it('service is passed to hanlder funciton', async() => {
		const res = await svc.get('/');
		expect(res.statusCode).to.equal(200);
		expect(res.body.serviceName).to.eql('loadFromDir');
	});

	it('loaded POST /{id}', async() => {
		const res = await svc.post('/{id}').send({ test: 'prop' });
		expect(res.statusCode).to.equal(200);
		expect(res.body).to.eql({
			res: 'POST /{id}',
		});
	});

	it('returns HTTP 500 when handler throws exception', async() => {
		const res = await svc.get('/500');
		expect(res.statusCode).to.equal(500);
	});

	it('returns HTTP 500 when handler throws non error Object', async() => {
		const res = await svc.get('/500-no-error-object-thrown');
		expect(res.statusCode).to.equal(500);
	});

	it('can use async handler', async() => {
		const res = await svc.get('/async');
		expect(res.body).to.eql({ ok: true });
	});

	it('async handler has proper error handling', async() => {
		const res = await svc.get('/async-500');
		expect(res.statusCode).to.eql(500);
	});

	it('reply interface has withEvent() mthod', async() => {
		const res = await svc.put('/with-event').send({});
		expect(res.statusCode).to.equal(201);
	});

	it('reply interface has withEvent() handles null content correctly', async() => {
		const res = await svc.put('/with-event-no-content').send({});
		expect(res.statusCode).to.equal(204);
		expect(res.text).to.equal('');
	});
});
