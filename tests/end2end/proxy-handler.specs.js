'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, one-var: 0, no-unused-expressions: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const { expect } = require('chai');
const bb = require('bluebird');
const path = require('path');

const chance = new Chance();

describe('Proxy Handler', () => {
	let port,
		svc,
		onRequestCalled;

	beforeEach(() => {
		onRequestCalled = false;
	});
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

		service.handlers.add('GET', '/hit-me', async (req, reply) => {
			reply({
				headers: req.headers,
				path: req.path,
				method: req.method,
			});
		});
		service.handlers.add('GET', '/map-uri1', { proxy: {
			mapUri: async () => `http://localhost:${port}/hit-me`,
		} });
		service.handlers.add('GET', '/map-uri2', { proxy: {
			mapUri: async (req, s) => {
				return {
					uri: `http://localhost:${port}/hit-me`,
					headers: { 'x-header': 'set', 'x-service-name': s.name },
				};
			},
		} });
		service.handlers.add('GET', '/map-uri-is-hie', { proxy: {
			mapUri: async () => {
				throw new Error('Hie is');
			},
		} });

		service.handlers.add('GET', '/on-reseponse-async', { proxy: {
			mapUri: async () => `http://localhost:${port}/hit-me`,
			onResponse: async (err, res, request, reply, settings, ttl, s) => {
				await bb.delay(20);
				reply(`eh klor: ${s.name}`);
			},
			onRequest: (req, s) => {
				onRequestCalled = s.name;
			},
		} });
		service.handlers.add('GET', '/on-reseponse-reply-with-event', { proxy: {
			mapUri: async () => `http://localhost:${port}/hit-me`,
			onResponse: async (err, res, request, reply) => {
				reply.withEvent('eh klor');
			},
		} });
		atrix.addService(service);
		await atrix.services.proxy.start();
		svc = supertest(`http://localhost:${port}`);
	});

	after(async () => {
		await atrix.services.proxy.stop();
	});

	describe('"mapUri"', () => {
		it('can proxy with "mapUri" directly returning uri as string', async () => {
			const res = await svc.get('/map-uri1');
			expect(res.statusCode).to.equal(200);
			const resp = JSON.parse(res.text);
			expect(resp.method).to.eql('get');
			expect(resp.path).to.eql('/hit-me');
		});

		it('"mapUri" can return object: { uri: <upstream>, headers: <headers> }', async () => {
			const res = await svc.get('/map-uri2');
			expect(res.statusCode).to.equal(200);
			const resp = JSON.parse(res.text);
			expect(resp.headers['x-header']).to.eql('set');
		});

		it('passes service to "mapUri" function', async () => {
			const res = await svc.get('/map-uri2');
			expect(res.statusCode).to.equal(200);
			const resp = JSON.parse(res.text);
			expect(resp.headers['x-service-name']).to.eql('proxy');
		});

		it('handles error in "mapUri" correctly', async () => {
			const res = await svc.get('/map-uri-is-hie');
			expect(res.statusCode).to.equal(500);
		});
	});

	describe('"onResponse"', () => {
		it('can use "onResponse" async function with service argument', async () => {
			const res = await svc.get('/on-reseponse-async');
			expect(res.statusCode).to.equal(200);
			expect(res.text).to.eql('eh klor: proxy');
		});

		it('can use "reply.withEvent()" in "onResponse"', async () => {
			const res = await svc.get('/on-reseponse-reply-with-event');
			expect(res.statusCode).to.equal(200);
			expect(res.text).to.eql('eh klor');
		});
	});

	describe('"onResponse"', () => {
		it('inject service argument', async () => {
			await svc.get('/on-reseponse-async');
			expect(onRequestCalled).to.eql('proxy');
		});
	});

	it('can load prox from handler file', async () => {
		const res = await svc.get('/proxy');
		expect(res.statusCode).to.equal(200);
		expect(res.text).to.contain('google');
	});
});
