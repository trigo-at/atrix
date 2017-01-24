'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const Atrix = require('@trigo/atrix').Atrix;
const path = require('path');
const AtrixSwagger =  require('./AtrixSwagger');
const Joi = require('joi');

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
			let cfg;
			before(async () => {
				const atrix = new Atrix();
				const serivce = new atrix.Service('s', { swagger: { serviceDefinition: path.join(__dirname, '../specs/s2.yml') } });
				const as = new AtrixSwagger(atrix, serivce);
				await as.loadServiceDefinition();
				cfg = await as.setupServiceHandler({ method: 'GET', path: '/pets/{petId}' });
			});

			it('creates config -> validate -> params Joi schema', async () => {
				expect(cfg.config.validate.params).to.exist;
			});
		});

		describe('createParameterValidation', () => {
			let as;
			before(async () => {
				const atrix = new Atrix();
				const serivce = new atrix.Service('s', {});
				as = new AtrixSwagger(atrix, serivce);
			});

			function getSchema(def) {
				const config = {};
				as.createParameterValidation(config, def);
				const schema = Joi.object(config);
				return {
					schema: schema,
					ok: (obj) => {
						Joi.assert(obj, schema);
					},
					fail: (obj, msg) => {
						expect(() => Joi.assert(obj, schema)).to.throw(Error, msg);
					},
				};
			}

			describe('basic types', () => {
				it('creates integer validator', () => {
					const schema = getSchema({
						name: 'test',
						type: 'integer',
					});
					schema.ok({ test: 100 });
					schema.fail({ test: 'asd' }, /must be a number/);
					schema.fail({ test: 1.2 }, /must be an integer/);
				});

				it('creates number validator', () => {
					const schema = getSchema({
						name: 'test',
						type: 'number',
					});

					schema.ok({ test: 100 });
					schema.ok({ test: -100.3 });
					schema.fail({ test: 'asd' }, /must be a number/);
					schema.fail({ test: false }, /must be a number/);
				});

				it('creates string validator', () => {
					const schema = getSchema({
						name: 'test',
						type: 'string',
					});

					schema.ok({ test: '100' });
					schema.ok({ test: 'asdgasg' });
					schema.fail({ test: 12 }, /must be a string/);
					schema.fail({ test: false }, /must be a string/);
				});

				it('creates date validator', () => {
					const schema = getSchema({
						name: 'test',
						type: 'string',
						format: 'date',
					});

					schema.ok({ test: '1980-05-14' });
					schema.fail({ test: new Date().toISOString() });
				});

				it('creates date-time validator', () => {
					const schema = getSchema({
						name: 'test',
						type: 'string',
						format: 'date-time',
					});

					schema.ok({ test: new Date().toISOString() });
					schema.ok({ test: new Date() });
					schema.fail({ test: 'ka date' });
				});

				it('creates boolean validator', () => {
					const schema = getSchema({
						name: 'test',
						type: 'boolean',
					});

					schema.ok({ test: true });
					schema.ok({ test: false });
					schema.fail({ test: 0 });
					schema.fail({ test: 1 });
				});
			});

			describe('attribute "required"', () => {
				it('make property required', () => {
					const schema = getSchema({
						name: 'test',
						type: 'string',
						required: true,
					});
					schema.ok({ test: 'true' });
					schema.fail({});
				});
			});

			describe('string options', () => {
				it('handles "pattern" attribute', () => {
					const schema = getSchema({
						name: 'test',
						type: 'string',
						pattern: '^start',
					});
					schema.ok({ test: 'start' });
					schema.fail({ test: 'notstart' });
				});

				it('handles "minLength" attribute', () => {
					const schema = getSchema({
						name: 'test',
						type: 'string',
						minLength: 4,
					});
					schema.ok({ test: 'start' });
					schema.fail({ test: 'i12' }, /length must be at least 4 character/);
				});

				it('handles "maxLength" attribute', () => {
					const schema = getSchema({
						name: 'test',
						type: 'string',
						maxLength: 4,
					});
					schema.ok({ test: 'stat' });
					schema.fail({ test: 'i12as' }, /length must be less than or equal to 4 characters/);
				});
			});
		});
	});
});

