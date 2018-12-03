'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, no-unused-expressions: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();

describe('endpoint startup', () => {
	let svc, svc2, service, service2;

	before(async () => {
		const port = chance.integer({ min: 20000, max: 30000 });
		service = atrix.addService({
			name: 'endpoints',
			endpoints: {
				http: {
					port,
				},
			},
		});
		service.handlers.add('GET', '/', (req, reply) => reply());
		await service.start();

		const port2 = chance.integer({ min: 20000, max: 30000 });
		service2 = atrix.addService({
			name: 'endpointDisabled',
			endpoints: {
				http: {
					enabled: false,
					port: port2,
				},
			},
		});
		service2.handlers.add('GET', '/', (req, reply) => reply());
		await service2.start();
		svc = supertest(`http://localhost:${port}`);
		svc2 = supertest(`http://localhost:${port2}`);
	});

	after(async () => {
		await service.stop();
		await service2.stop();
	});

	it('endpoint is started by default', (done) => {
		svc.get('/').expect(200, done);
	});
	it('endpoint with "enabled => false" is not started by default', async () => {
		let err;
		try {
			await svc2.get('/');
		} catch (e) {
			err = e;
		}
		expect(err).to.exist;
		expect(err.message).to.contain('ECONNREFUSED');
	});
});
