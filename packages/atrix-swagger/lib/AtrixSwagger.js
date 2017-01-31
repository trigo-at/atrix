'use strict';

const SwaggerParser = require('swagger-parser');
const fs = require('fs');
const BaseJoi = require('joi');
const DateExtension = require('joi-date-extensions');
const R = require('ramda');
const { createParameterValidator, createResponseValidator } = require('./create-parameter-validator');

const Joi = BaseJoi.extend(DateExtension);

const getParams = R.filter(R.propEq('in', 'path')); // eslint-disable-line
const getQuery = R.filter(R.propEq('in', 'query')); // eslint-disable-line
const getBody = R.filter(R.propEq('in', 'body')); // eslint-disable-line

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

		const httpEndpoint = this.service.endpoints.get('http');
		if (!httpEndpoint) {
			this.log.warn('No HttpEndpoind registered');
			return;
		}
		httpEndpoint.instance.registerRouteProcessor(this);
	}

	async init() {
		await this.loadServiceDefinition();
	}

	async process(handlers) {
		// const retHandlers = handlers;
		for (const handler of handlers) { //eslint-disable-line
			const route = await this.setupServiceHandler(handler); //eslint-disable-line
			handler.method = route.method;
			handler.path = route.path;
			handler.config = route.config;
		}

		const swaggerJson = {
			method: 'GET',
			path: '/swagger.json',
			handler: (req, reply) => {
				reply(this.serviceDefinition);
			},
			config: {
				cors: true,
			},
		};

		handlers.push(swaggerJson);
		return handlers;
	}

	async loadServiceDefinition() {
		const parser = new SwaggerParser();
		this.serviceDefinition = await parser.dereference(this.config.swagger.serviceDefinition);
	}

	async setupServiceHandler({ method, path, config }) {
		// this.log.debug('setupServiceHandler', arguments); // eslint-disable-line

		const handlerDefinition = this.getHandlerDefinition(path);
		if (!handlerDefinition || !handlerDefinition[method.toLowerCase()]) {
			this.log.warn(`No Swagger specification found for route: ${method} ${path}`);
			return {
				method,
				path,
				config,
			};
		}
		const routeSpecs = handlerDefinition[method.toLowerCase()];
		const newConfig = config ? R.clone(config) : {}; // eslint-disable-line

		newConfig.validate = newConfig.validate || {};
		if (routeSpecs.parameters) {
			newConfig.validate.params = AtrixSwagger.createParameterValidator(getParams(routeSpecs.parameters));
			newConfig.validate.query = AtrixSwagger.createParameterValidator(getQuery(routeSpecs.parameters));
			newConfig.validate.payload = AtrixSwagger.createParameterValidator(getBody(routeSpecs.parameters));
		}

		newConfig.response = this.createResponseValidator(routeSpecs.responses);

		// if (method === 'GET' && path === '/tasks')
		// this.log.info(JSON.stringify(newConfig, null, 2));

		return {
			method,
			path,
			config: newConfig,
		};
	}


	static createParameterValidator(parameters) {
		// this.log.debug('createParamsValidation', params);
		if (!parameters.length) {
			return false;
		}
		const config = {};
		parameters.forEach((parameter) => {
			config[parameter.name] = createParameterValidator(parameter);
		});

		const schema = Joi.object(config);
		return schema;
	}

	createResponseValidator(responses) {
		const config = {
			status: {},
		};

		let haveSchema = false;
		Object.keys(responses).forEach((statusCode) => {
			if (statusCode === 'default') {
				this.log.warn('Unsupported responses key: "default" please specify concreate statusCode');
				return;
			}
			// console.log(`Create validator for: ${statusCode}`, responses[statusCode]);
			const schema = createResponseValidator(responses[statusCode]);
			if (schema !== null) {
				config.status[statusCode] = schema;
				haveSchema = true;
			}
		});

		return haveSchema ? config : undefined;
	}

	getHandlerDefinition(path) {
		return this.serviceDefinition.paths[path];
	}

}

module.exports = AtrixSwagger;
