'use strict';

const path = require('path')
const resolveHandlers = require('./resolve-handlers');
const expect = require('chai').expect;
const R = require('ramda');

describe.only('resolve-handlers', () => {
	let routes;
	beforeEach(() => {
		routes = resolveHandlers(path.join(__dirname, '../../tests/test-handler-dir'));
	});

	it('returns object with handler definietions', () => {
		expect(routes).to.be.an('array');
	});

	it('resolves paths', () => {
		expect(R.find(R.propEq('/', 'path')), routes).to.exist;
		expect(R.find(R.propEq('/alive', 'path')), routes).to.exist;
		expect(R.find(R.propEq('/{id}', 'path')), routes).to.exist;
		expect(R.find(R.propEq('/users/{username}', 'path')), routes).to.exist;
		expect(R.find(R.propEq('/users/{id}/password', 'path')), routes).to.exist;
	});
});
