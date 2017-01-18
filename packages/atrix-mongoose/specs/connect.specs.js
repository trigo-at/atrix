'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
require('./service');
const atrix = require('@trigo/atrix');

describe('loads datasources into service', () => {
	beforeEach(async () => {
		await atrix.services.mongoose.start();
	});
	it.only('connecting on start', async () => {
		expect(atrix.services.mongoose.dataSources.m1).to.be.an('object');
		expect(atrix.services.mongoose.dataSources.m2).to.be.an('object');
	});
});

