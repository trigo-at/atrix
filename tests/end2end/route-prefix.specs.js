'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const svc = require('./services').routeprefix;
const expect = require('chai').expect;

describe('route-prefix', () => {
	it('routes are prefixed with the supllied value', async() => {
		const res = await svc.get('/events/api/');
		expect(res.statusCode).to.equal(200);
		expect(res.body).to.eql({
			test: {
				key: 'value',
			},
		});
	});
});
