'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const globalConfig = require('./global-config')();
const {expect} = require('chai');
const path = require('path');

describe('global-config', () => {
	beforeEach(() => {
		globalConfig.reset();
	});

	it('defaults to empty object', () => {
		expect(globalConfig.pluginSearchPaths).to.eql([]);
		expect(globalConfig).to.exist;
	});

	it('can add plugin search path', () => {
		globalConfig.pluginSearchPaths.push(path.join(__dirname, '../tests/'));
		expect(globalConfig.pluginSearchPaths).to.eql([
			path.join(__dirname, '../tests/'),
		]);
	});

	it('can reset the config', () => {
		globalConfig.pluginSearchPaths.push(path.join(__dirname, '../tests/'));
		globalConfig.reset();
		expect(globalConfig.pluginSearchPaths).to.eql([]);
	});
});
