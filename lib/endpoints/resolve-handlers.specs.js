'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, no-unused-expressions: 0, arrow-body-style: 0 */

const path = require('path');
const R = require('ramda');
const resolveHandlers = require('./resolve-handlers');
const expect = require('chai').expect;
const log = require('../Logger').createLogger({ name: 'test' });

const service = {
	log,
};

const getPath = (route, routes) => R.find(R.propEq('path', route), routes);

describe('resolve-handlers', () => {
	let routes;
	beforeEach(() => {
		routes = resolveHandlers(path.join(__dirname, '../../tests/test-handler-dir'), service);
	});

	it('returns object with handler definietions', () => {
		expect(routes).to.be.an('array');
	});

	it('resolves paths', () => {
		expect(getPath('/', routes)).to.exist;
		expect(getPath('/alive', routes)).to.exist;
		expect(getPath('/{id}', routes)).to.exist;
		expect(getPath('/users/{username}', routes)).to.exist;
		expect(getPath('/users/{id}/password', routes)).to.exist;
	});

	it('parses HTTP verb form filename', () => {
		expect(getPath('/', routes).method).to.eql('GET');
		expect(getPath('/alive', routes).method).to.equal('GET');
		expect(getPath('/{id}', routes).method).to.equal('POST');
		expect(getPath('/users/{username}', routes).method).to.equal('PUT');
		expect(getPath('/users/props/{id}', routes).method).to.equal('PATCH');
	});

	it('parses HTTP verb form filename', () => {
		expect(getPath('/', routes).handler).to.be.a('function');
	});

	it('throws Error when duplicate path defined', () => {
		expect(() => resolveHandlers(path.join(__dirname, '../../tests/test-handler-dir-dupl'), service)).to.throw(Error);
	});

	it('can overrwrite path in handler module', () => {
		expect(getPath('/herbert', routes).method).to.eql('GET');
	});

	it('can overrwrite HTTP method in handler module', () => {
		expect(getPath('/emil', routes).method).to.eql('DELETE');
	});

	it('can set route config in handler module', () => {
		expect(getPath('/emil', routes).config).to.eql({
			query: false,
		});
	});
});
