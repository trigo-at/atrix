'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const svc = require('./services').loadFromDir;
const expect = require('chai').expect;

describe('service.request() interface', () => {
	it('returns headers', async() => {
		const res = await svc.get('/service-request');
		expect(res.body.headers).to.be.an('object');
	});
	it('returns statusCode', async() => {
		const res = await svc.get('/service-request');
		expect(res.body.statusCode).to.equal(200);
	});
	it('returns result', async() => {
		const res = await svc.get('/service-request');
		expect(res.body.result).to.eql({ res: 'POST /{id}' });
	});
	it('returns statusMessage', async() => {
		const res = await svc.get('/service-request');
		expect(res.body.statusMessage).to.eql('OK');
	});
	it('returns payload', async() => {
		const res = await svc.get('/service-request');
		expect(res.body.payload).to.eql('{"res":"POST /{id}"}');
	});
	it('returns rawPayload', async() => {
		const res = await svc.get('/service-request');
		expect(new Buffer(res.body.rawPayload).toString()).to.equal('{"res":"POST /{id}"}');
	});
});
