'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../../');
const svc = require('./services').multiSecured;
const expect = require('chai').expect;

describe('muti-secured-svc', () => {
	it('GET /jwt is secured', async() => {
		const res = await svc.get('/jwt');
		expect(res.statusCode).to.equal(401);
	});

	it('GET /signedlink is secured', async() => {
		const res = await svc.get('/signedlink');
		expect(res.statusCode).to.equal(401);
	});

	it('GET /test is not secured', async() => {
		const res = await svc.get('/test');
		expect(res.statusCode).to.equal(200);
	});

	it('"signedlink" strategy add "createSignedLink" utility to the service', async () => {
		const link = atrix.services.multiSecured.createSignedLink('/signedlink');
		const res = await svc.get(link);
		expect(res.statusCode).to.equal(200);
	});
});
