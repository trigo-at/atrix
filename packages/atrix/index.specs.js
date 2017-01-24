'use strict';

'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const Atrix = require('./Atrix');
const index = require('./index');

describe('entrypoint', () => {
	it('returns instanziated Atrix default instance', () => {
		expect(index.constructor).to.equal(Atrix);
	});

	it('it exposes Atrix constructor as porperty "Atrix"', () => {
		expect(index.Atrix).to.equal(Atrix);
	});
});

