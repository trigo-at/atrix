'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const svc = require('./services').logger;
const expect = require('chai').expect;

describe('logger-cfg', () => {
	it('applies logger configuration', async () => {
		const res = await svc.get('/');
		expect(res.statusCode).to.equal(200);
		expect(res.body).to.eql({
			test: {
				key: 'value',
			},
		});
	});
});
