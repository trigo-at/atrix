'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, one-var: 0, no-unused-expressions: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const { expect } = require('chai');
const path = require('path');

const chance = new Chance();

describe('Proxy Handler Wildcard', () => {
	let port,
		svc;

	before(async () => {
		port = chance.integer({ min: 20000, max: 30000 });
		const service = new atrix.Service('proxy', {
			endpoints: {
				http: {
					port,
					handlerDir: path.join(__dirname, '/../proxy-handler/'),
				},
			},
		});

		service.endpoints.add('http');

		atrix.addService(service);
		await atrix.services.proxy.start();
		svc = supertest(`http://localhost:${port}`);
	});

	after(async () => {
		await atrix.services.proxy.stop();
	});

	it("can use different wildcard '%' as method from file name", async () => {
		expect((await svc.get('/without-method')).statusCode).to.equal(200);
		expect((await svc.post('/without-method')).statusCode).to.equal(200);
		expect((await svc.put('/without-method')).statusCode).to.equal(200);
		expect((await svc.patch('/without-method')).statusCode).to.equal(200);
		expect((await svc.delete('/without-method')).statusCode).to.equal(200);
	});
});
