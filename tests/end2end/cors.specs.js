'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, one-var: 0, no-unused-expressions: 0 */


const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const { expect } = require('chai');

const chance = new Chance();

describe('CORS settings', () => {
	let port,
		svc;

	const startWithCorsCfg = async (cors) => {
		port = chance.integer({ min: 20000, max: 30000 });
		const service = new atrix.Service('cors', {
			endpoints: {
				http: {
					port,
					cors,
				},
			},
		});

		service.endpoints.add('http');

		service.handlers.add('GET', '/', (req, reply) => reply({ foo: 'bar' }));

		atrix.addService(service);
		await atrix.services.cors.start();
		svc = supertest(`http://localhost:${port}`);
	};

	afterEach(async () => {
		await atrix.services.cors.stop();
	});

	it('setting "cors: true" makes server accept any origing (e.g. reflect orign header in "access-control-allow-origin")', async () => {
		await startWithCorsCfg(true);

		const res = await svc.options('/').set({
			origin: 'http://wos-was-i.at',
			'Access-Control-Request-Method': 'GET',
		});
		expect(res.headers['access-control-allow-origin']).to.eql('http://wos-was-i.at');
	});

	it('setting "cors: true" merges content-type,authorization & access-control-allow-origin into access-control-allow-headers', async () => {
		await startWithCorsCfg(true);

		const res = await svc.options('/').set({
			origin: 'http://wos-was-i.at',
			'Access-Control-Request-Method': 'GET',
		});
		expect(res.headers['access-control-allow-headers']).to.contain('content-type');
		expect(res.headers['access-control-allow-headers']).to.contain('authorization');
		expect(res.headers['access-control-allow-headers']).to.contain('access-control-allow-origin');
	});

	it('setting "cors: true" sets access-control-allow-credentials => true', async () => {
		await startWithCorsCfg(true);

		const res = await svc.options('/').set({
			origin: 'http://wos-was-i.at',
			'Access-Control-Request-Method': 'GET',
		});
		expect(res.headers['access-control-allow-credentials']).to.eql('true');
	});

	it('sets cors config object to priovided value', async () => {
		const cors = {
			origin: ['http://test.com'],
			additionalHeaders: ['authorization', 'content-type'],
			credentials: true,
		};
		await startWithCorsCfg(cors);
		let res = await svc.options('/').set({
			origin: 'http://test.com',
			'Access-Control-Request-Method': 'GET',
		});
		expect(res.headers['access-control-allow-origin']).to.eql('http://test.com');
		res = await svc.options('/').set({
			origin: 'http://tasdest.com',
			'Access-Control-Request-Method': 'GET',
		});

		expect(res.headers['access-control-allow-origin']).not.to.exist;
	});
});
