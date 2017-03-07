'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const cfgObj = {};
const configure = require('./configure')(cfgObj);
const { expect } = require('chai');

describe('configure', () => {
	it('merges configurations', () => {
		Object.keys(cfgObj, (key) => {
			delete cfgObj[key];
		});

		configure({ pluginSearchPaths: ['test'] });

		expect(cfgObj.pluginSearchPaths).to.eql(['test']);
	});
});
