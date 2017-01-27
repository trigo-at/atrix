'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const Atrix = require('@trigo/atrix').Atrix;
const path = require('path');
const AtrixSwagger = require('./AtrixSwagger');

describe('AtrixSwagger', () => {
	describe('constructor', () => {
		it('ignores if "swagger" config missing', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', {});
			expect(() => new AtrixSwagger(atrix, serivce)).not.to.throw(Error);
		});

		it('checks if configure "swagger -> serivceDefinition" exist', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', { swagger: { serviceDefinition: 'gibts ned' } });
			expect(() => new AtrixSwagger(atrix, serivce)).to.throw(Error);
			expect(() => new AtrixSwagger(atrix, serivce)).to.throw('No serviceDefinition found at "gibts ned"');
		});
	});

	describe('loadServiceDefinition', () => {
		it('loads and parses the definition into property "serviceDefinition"', async () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', { swagger: { serviceDefinition: path.join(__dirname, '../specs/s1.yml') } });
			const as = new AtrixSwagger(atrix, serivce);
			await as.loadServiceDefinition();
			expect(as.serviceDefinition).to.exist;
		});
	});

	describe('setupServiceHandler', () => {
		it.skip('does not modify handle with minimal definition', async () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', { swagger: { serviceDefinition: path.join(__dirname, '../specs/s1.yml') } });
			const as = new AtrixSwagger(atrix, serivce);
			await as.loadServiceDefinition();
			const def = { method: 'GET', path: '/' };
			const ret = await as.setupServiceHandler(def);
			expect(ret).to.eql(def);
		});

		describe('params validations', () => {
			let as;
			before(async () => {
				const atrix = new Atrix();
				const serivce = new atrix.Service('s', { swagger: { serviceDefinition: path.join(__dirname, '../specs/pet-shop.yml') } });
				as = new AtrixSwagger(atrix, serivce);
				await as.loadServiceDefinition();
			});

			it('creates config -> validate -> params Joi schema', async () => {
				const cfg = await as.setupServiceHandler({ method: 'GET', path: '/pets/{petId}' });
				expect(cfg.config.validate.params).to.exist;
			});
			it.skip('creates config -> validate -> query Joi schema', async () => {
				const cfg = await as.setupServiceHandler({ method: 'GET', path: '/pets/findByTags' });
				expect(cfg.config.validate.query).to.exist;
			});
		});
	});
});

