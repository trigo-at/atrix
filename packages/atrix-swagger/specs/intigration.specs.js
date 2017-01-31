'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const svc = require('./service');


describe('Handlers registrations are intercepted and altered', () => {
	before(async () => {
		await svc.start();
	});
	describe('GET /pets/{petId}', () => {
		it('handles petId as nubmer', async () => {
			const res = await svc.test.get('/pets/42');
			expect(res.statusCode).to.equal(200);
			expect(res.body).to.eql({
				id: 42,
				name: 'Pet 42',
				photoUrls: ['http://pet_42.pic'],
			});
		});

		it('return HTTP 400 when using non number petId', async () => {
			const res = await svc.test.get('/pets/nedso');
			expect(res.statusCode).to.equal(400);
		});
	});

	describe('GET /users/login', () => {
		it('corectly validates valid string reply', async () => {
			const res = await svc.test.get('/users/login');
			expect(res.statusCode).to.equal(200);
			expect(res.text).to.equal('username');
		});

		it('HTTP 500 when returns invalid integer', async () => {
			const res = await svc.test.get('/users/login?username=invalid');
			expect(res.statusCode).to.equal(500);
		});
	});

	describe('GET /swagger.json', () => {
		it('servers swagger API JSON', async () => {
			const res = await svc.test.get('/swagger.json');
			expect(res.statusCode).to.equal(200);
			expect(res.body.info.title).to.equal('Test based on Swagger Pet Store');
			expect(res.headers['content-type']).to.contain('application/json');
		});
	});
});
