'use strict';

const SwaggerParser = require('swagger-parser');
const fs = require('fs');

const BaseJoi = require('joi');
const DateExtension = require('joi-date-extensions');

const R = require('ramda');

const Joi = BaseJoi.extend(DateExtension);

const getParams = R.filter(R.propEq('in', 'path'), R.__); // eslint-disable-line

class AtrixSwagger {
	constructor(atrix, service) {
		this.atrix = atrix;
		this.service = service;
		this.config = service.config.config;
		this.log = this.service.log.child({ plugin: 'AtrixSwagger' });

		if (!this.config.swagger) {
			this.log.warn(`No "swagger" section found config of service "${this.service.name}"`);
			return;
		}

		if (!fs.existsSync(this.config.swagger.serviceDefinition)) {
			throw new Error(`No serviceDefinition found at "${this.config.swagger.serviceDefinition}"`);
		}
	}

	async loadServiceDefinition() {
		const parser = new SwaggerParser();
		this.serviceDefinition = await parser.dereference(this.config.swagger.serviceDefinition);
	}

	async setupServiceHandler({ method, path, config }) {
		this.log.debug('setupServiceHandler', arguments); // eslint-disable-line
		const newConfig = config ? R.clone(config) : {}; // eslint-disable-line

		const handlerDefinition = this.getHandlerDefinition(path);
		// console.log(JSON.stringify(handlerDefinition, null, 2));

		newConfig.validate = newConfig.validate || {};
		if (handlerDefinition[method.toLowerCase()].parameters) {
			const paramsParameters = getParams(handlerDefinition[method.toLowerCase()].parameters);
			newConfig.validate.params = this.createParamsValidation(paramsParameters);
		}
		return {
			method,
			path,
			config: newConfig,
		};
	}


	createParameterValidation(config, parameter) {
		this.log.debug('createParameterValidation', config, parameter);
		let schema;
		switch (parameter.type) {
			case 'string':
				if (parameter.format) {
					switch (parameter.format) {
						case 'date':
							schema = Joi.date().format('YYYY-MM-DD');
							break;
						case 'date-time':
							schema = Joi.date().iso();
							break;
						default:
							throw new Error(`Unknown format: ${parameter.format}`);
					}
				} else if (parameter.pattern) {
					schema = Joi.string().regex(new RegExp(parameter.pattern));
				} else {
					schema = Joi.string();
				}

				if (parameter.minLength !== undefined) {
					schema = schema.min(parameter.minLength);
				}
				if (parameter.maxLength !== undefined) {
					schema = schema.max(parameter.maxLength);
				}
				break;
			case 'integer':
				schema = Joi.number().integer();
				break;
			case 'number':
				schema = Joi.number();
				break;
			case 'boolean':
				schema = Joi.boolean();
				break;
			default:
				throw new Error(`Unknown type: ${parameter.type}`);
		}

		if (parameter.required) {
			schema = schema.required();
		}

		config[parameter.name] = schema; // eslint-disable-line
	}

	createParamsValidation(params) {
		this.log.debug('createParamsValidation', params);
		const config = {};
		params.forEach(param => {
			this.createParameterValidation(config, param);
		});

		const schema = Joi.object(config);
		return schema;
	}

	getHandlerDefinition(path) {
		return this.serviceDefinition.paths[path];
	}

}

module.exports = AtrixSwagger;
