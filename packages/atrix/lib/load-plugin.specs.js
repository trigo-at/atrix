'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, no-unused-expressions: 0, arrow-body-style: 0 */

const loadPlugin = require('./load-plugin');
const atrix = require('../');
const path = require('path');
const { expect } = require('chai');

describe('load-plugin', () => {
	beforeEach(() => {
		atrix.config.reset();
	});

	it('tries to load from package named "@trigo/atrix-plugin"', async () => {
		expect(() => loadPlugin(atrix, 'plugin')).to.throw('Cannot find module \'@trigo/atrix-plugin\'');
	});

	it('tries to load from fs locations in globalConfig.pluginSearchPaths with pattern atrix-<plugin-name>', async () => {
		atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));
		const p = loadPlugin(atrix, 'test-plugin');

		expect(p).to.exist;
	});


	it('validates plugin to contain "name" property', async () => {
		atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

		expect(() => loadPlugin(atrix, 'test-plugin-no-name')).to.throw('Required property "name" missing');
	});

	it('validates plugin to contain "version" property', async () => {
		atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

		expect(() => loadPlugin(atrix, 'test-plugin-no-version')).to.throw('Required property "version" missing');
	});

	it('validates plugin to contain "register" function', async () => {
		atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

		expect(() => loadPlugin(atrix, 'test-plugin-no-register')).to.throw('Required function "register" missing');
	});

	it('calls the plugin "register" function with atrix as argument', () => {
		atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));
		const p = loadPlugin(atrix, 'test-plugin');
		expect(p.atrix).to.equal(atrix);
	});
});
