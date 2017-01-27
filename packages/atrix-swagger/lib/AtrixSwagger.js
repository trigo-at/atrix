'use strict';

const SwaggerParser = require('swagger-parser');
const fs = require('fs');

const BaseJoi = require('joi');
const DateExtension = require('joi-date-extensions');

const R = require('ramda');

const Joi = BaseJoi.extend(DateExtension);

const getParams = R.filter(R.propEq('in', 'path'), R.__); // eslint-disable-line
const getQuery = R.filter(R.propEq('in', 'query'), R.__); // eslint-disable-line
const createParameterValidator = require('./create-parameter-validator');

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
			newConfig.validate.params = AtrixSwagger.createParameterValidator(getParams(handlerDefinition[method.toLowerCase()].parameters));
			newConfig.validate.query = AtrixSwagger.createParameterValidator(getQuery(handlerDefinition[method.toLowerCase()].parameters));
		}
		return {
			method,
			path,
			config: newConfig,
		};
	}


	static createParameterValidator(parameters) {
		// this.log.debug('createParamsValidation', params);
		const config = {};
		parameters.forEach(parameter => {
			config[parameter.name] = createParameterValidator(parameter);
		});

		const schema = Joi.object(config);
		return schema;
	}

	getHandlerDefinition(path) {
		return this.serviceDefinition.paths[path];
	}

}

module.exports = AtrixSwagger;
