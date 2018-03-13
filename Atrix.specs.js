'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, no-unused-expressions: 0, arrow-body-style: 0 */

const {expect} = require('chai');
const Atrix = require('./Atrix');

const atrix = new Atrix();

describe('atrix', () => {
	it('exposes property "config"', () => {
		expect(atrix.config).to.be.an('object');
	});

	it('cannot set property "config"', () => {
		expect(() => {
			atrix.config = {};
		}).to.throw();
	});

	it('exposes function "configure"', () => {
		expect(atrix.configure).to.be.a('function');
	});
});
