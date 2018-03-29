'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const svc = require('./services').secured;
const expect = require('chai').expect;

describe('secured-svc', () => {
	it('GET /data is secured', async () => {
		const res = await svc.get('/data');
		expect(res.statusCode).to.equal(401);
	});
	it('GET /test is not secured', async () => {
		const res = await svc.get('/test');
		expect(res.statusCode).to.equal(200);
	});
});
