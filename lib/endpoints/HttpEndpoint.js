'use strict';

const { clone, omit } = require('ramda');
const Hapi = require('hapi');
const Boom = require('boom');
const resolveHandlers = require('./resolve-handlers');
const inert = require('inert');
const h2o2 = require('h2o2');
const Blipp = require('blipp');
const HapiBunyan = require('./HapiBunyan');
const HapiRequestLogger = require('./HapiRequestLogger');
const hapiAuthJwt = require('hapi-auth-jwt');
const hapiAuthSignedLink = require('@trigo/hapi-auth-signedlink');
const Joi = require('joi');
const debug = require('debug')('@trigo/atrix:http-endpoint');

const NODE_ENV = process.env.NODE_ENV;

const configSchema = Joi.object({
	port: Joi.number().integer().default(3000).description('the port the server listens'),
	handlerDir: Joi.string().description('the local dirctory containing the route handler files'),
	prefix: Joi.string().allow('').description('a prefix path prepended to all routes (e.g. when running behind rewrite proxy)'),
	cors: Joi.alternatives().try(
		Joi.boolean().description('when true CORS will be globally enabled withourt any origin restrictions'),
		Joi.object({
			origin: Joi.array().items(Joi.string()).description('list of allowed origins'),
			additionalHeaders: Joi.array().items(Joi.string()).description('list of additional headers'),
			credentials: Joi.boolean().default(true).description('aloows user credentials to be sent "Access-Control-Allow-Credentials"'),
		}),
	),
	requestLogger: Joi.object({
		enabled: Joi.boolean().default(false).description('wheter the request logger should be enabled'),
		logFullRequest: Joi.boolean().default(true).description('whether to log the full request data'),
		logFullResponse: Joi.boolean().default(true).description('wheter to log the full response data'),
		ignoreEndpoints: Joi.array().items(Joi.string()).default(['^/alive$']).description('list of exprssions for endpoints that should not be logged'),
	}).description('the request logger configuration').default({
		enabled: false,
		logFullRequest: true,
		logFullResponse: true,
		ignoreEndpoints: ['^/alive$'],
	}),
});

class HttpEndpoint {
	constructor(service, config) {
		this.handlers = [];
		this.service = service;
		this.log = this.service.log.child({ endpoint: 'http' });

		// => <CONFIG>.endpoints.http: { ... }
		this.config = Joi.attempt(config, configSchema);
		debug('Ednpoint configuration:', this.config);

		// => <CONFIG>.security: { ... }
		this.securityConfig = this.service.config.config.security;
		debug('Security configuration:', this.securityConfig);

		this.createServer();
		this.setupRequestInterface();
		this.routeProcessors = [];

		this.isSecured = !!this.securityConfig && this.securityConfig.strategies;
	}

	createServer() {
		this.server = new Hapi.Server();
		const cfg = {
			port: this.config.port,
		};
		const routesCfg = {};
		if (this.config.cors === true) {
			routesCfg.cors = {
				origin: ['*'],
				additionalHeaders: ['access-control-allow-origin', 'authorization', 'content-type'],
				credentials: true,
			};
		} else if (typeof this.config.cors === 'object') {
			routesCfg.cors = clone(this.config.cors);
		}
		cfg.routes = routesCfg;

		this.log.debug('Hapi Connection:', JSON.stringify(cfg, null, 2));
		this.server.connection(cfg);
	}

	setupRequestInterface() {
		this.service.request = async (options, parentRequest) => {
			const opts = Object.assign({}, options);
			if (!opts.headers) {
				opts.headers = {};
			}
			if (parentRequest && parentRequest.id && parentRequest.headers) {
				if (parentRequest.headers['x-atrix-context-req-id']) {
					opts.headers['x-atrix-context-req-id'] = parentRequest.headers['x-atrix-context-req-id'];
				} else {
					opts.headers['x-atrix-context-req-id'] = parentRequest.id;
				}
				opts.headers['x-atrix-parent-req-id'] = parentRequest.id;
			} else {
				this.service.log.warn(`Calling "service.request" without "parentRequest" paramater! ${opts.method} ${opts.url}`);
			}
			if (this.config.prefix) {
				opts.url = `${this.config.prefix}${opts.url}`;
			}
			const res = await this.server.inject(opts);
			const retval = omit(['res', 'req', 'request', 'raw'], res);
			return retval;
		};
	}

	async setupServer() {
		await this.server.register(inert);
		await this.server.register(h2o2);
		await this.server.register({ register: Blipp,
			options: {
				showAuth: true,
				showStart: true,
			},
		});
		await this.server.register({
			register: HapiBunyan.register,
			options: {
				logger: this.log,
			},
		});
		if (this.config.requestLogger && this.config.requestLogger.enabled) {
			const options = Object.assign({ logFullRequest: true, logFullResponse: true }, this.config.requestLogger);

			await this.server.register({
				register: HapiRequestLogger.register,
				options,
			});
		}
		if (this.isSecured) {
			if (this.securityConfig.strategies.signedlink) {
				await this.server.register(hapiAuthSignedLink);
				this.server.auth.strategy('signedlink', 'signedlink', {
					key: this.securityConfig.strategies.signedlink.secret,
				});
				this.service.createSignedLink = this.server.plugins.hapiAuthSignedlink.createLink;
			}
			if (this.securityConfig.strategies.jwt) {
				await this.server.register(hapiAuthJwt);
				this.server.auth.strategy('jwt', 'jwt', {
					key: this.securityConfig.strategies.jwt.secret,
					verifyOptions: {
						algorithms: [this.securityConfig.strategies.jwt.algorithm],
					},
				});
			}
		}

		if (this.config.handlerDir) {
			resolveHandlers(this.config.handlerDir, this.service).forEach((handler) => {
				this.registerHandler(handler.method, handler.path, handler.handler, handler.config);
			});
		}

		for (const processor of this.routeProcessors) {
			await processor.init();
			await processor.process(this.handlers);
		}

		this.server.ext('onRequest', (req, next) => {
			if (!req.headers['x-atrix-context-req-id']) {
				req.headers['x-atrix-context-req-id'] = req.id;
			}
			next.continue();
		});
		this.server.route(this.handlers);

		this.configured = true;
		return true;
	}

	registerRouteProcessor(processor) {
		if (this.routeProcessors.indexOf(processor) !== -1) {
			throw new Error('Duplicate routeProcessor registration');
		}
		this.routeProcessors.push(processor);
	}

	createRouteConfig(path, cfg) {
		const config = cfg || {};
		if (this.securityConfig) {
			if (Array.isArray(this.securityConfig.endpoints) && this.securityConfig.strategies.jwt) {
				const endpointPattern = this.securityConfig.endpoints.map(x => new RegExp(x));
				if (this.isSecured && endpointPattern.some(x => path.match(x))) {
					this.service.log.debug(`JWT secured endpoint: ${path}`);
					config.auth = {
						strategy: 'jwt',
					};
				}
			} else {
				if (this.securityConfig.endpoints.jwt) {
					const endpointPattern = this.securityConfig.endpoints.jwt.map(x => new RegExp(x));
					if (this.isSecured && endpointPattern.some(x => path.match(x))) {
						this.service.log.debug(`JWT secured endpoint: ${path}`);
						config.auth = {
							strategy: 'jwt',
						};
					}
				}
				if (this.securityConfig.endpoints.signedlink) {
					const endpointPattern = this.securityConfig.endpoints.signedlink.map(x => new RegExp(x));
					if (this.isSecured && endpointPattern.some(x => path.match(x))) {
						if (config.auth) {
							throw new Error(`CONFIGURATION ERROR: Route: "${path}" cannot be secured using "signedlink" strategy. It is already secured with: "${config.auth.strategy}" strategy.`); //eslint-disable-line
						}
						this.service.log.debug(`signedlink secured endpoint: ${path}`);
						config.auth = {
							strategy: 'signedlink',
						};
					}
				}
			}
		}
		return config;
	}

	replyWithEventFactory(req, reply) {
		return async (data, status = 200) => {
			if (this.service.plugins.pubsub) {
				await this.service.plugins.pubsub.publishHttpReply(req, data, status, this.config.prefix);
			} else {
				this.service.log.warn('@trigo/atrix-pubsub not installed and/or configured. No Event will be published');
			}

			if (data === null) {
				reply().code(status);
			} else {
				reply(data).code(status);
			}
		};
	}

	setupProxyHandler(handler) {
		const requestHandler = { proxy: { } };
		if (handler.proxy.mapUri) {
			requestHandler.proxy.mapUri = async (request, callback) => {
				try {
					const mapUriResult = await handler.proxy.mapUri(request, this.service);
					if (typeof mapUriResult === 'string') {
						callback(null, mapUriResult);
					} else {
						callback(null, mapUriResult.uri, mapUriResult.headers);
					}
				} catch (e) {
					callback(e);
				}
			};
		}
		if (handler.proxy.onResponse) {
			requestHandler.proxy.onResponse = async (err, res, request, reply, settings, ttl) => {
				// eslint-disable-next-line
				reply.withEvent = this.replyWithEventFactory(request, reply);
				await handler.proxy.onResponse(err, res, request, reply, settings, ttl, this.service);
			};
		}
		if (handler.proxy.onRequest) {
			requestHandler.proxy.onRequest = async (req) => {
				await handler.proxy.onRequest(req, this.service);
			};
		}

		['host', 'port', 'protocol', 'uri', 'passThrough', 'localStatePassThrough', 'acceptEncoding', 'rejectUnauthorized', 'xforward', 'redirects',
			'timeout', 'ttl', 'agent', 'maxSockets', 'secureProtocol', 'ciphers'].forEach((prop) => {
			if (handler.proxy[prop] !== undefined) {
				requestHandler.proxy[prop] = handler.proxy[prop];
			}
		});
		return requestHandler;
	}

	setupRouteHandler(handler) {
		if (handler.proxy) {
			return this.setupProxyHandler(handler);
		}
		return async (req, reply) => {
			try {
				// eslint-disable-next-line
				reply.withEvent = this.replyWithEventFactory(req, reply);
				await handler(req, reply, this.service);
			} catch (e) {
				let error = e;
				if (!(e instanceof Error)) {
					this.service.log.warn('Non-Error Object thrown!');
					error = new Error(e);
				}

				if (NODE_ENV === 'test' && !(e.isBoom && e.output.statusCode < 500)) {
					// eslint-disable-next-line no-console
					console.error(error.stack);
				}

				reply(Boom.wrap(error));
			}
		};
	}

	registerHandler(method, path, handler, cfg) {
		const config = this.createRouteConfig(path, cfg);
		const finalPath = this.config.prefix ? `${this.config.prefix}${path}` : path;

		this.handlers.push({
			method,
			path: finalPath,
			handler: this.setupRouteHandler(handler),
			config,
		});
	}

	async start() {
		if (!this.configured) {
			await this.setupServer();
		}

		await this.server.start();
		this.log.info(`Service "${this.service.name}" started on ${this.server.info.uri}`);
	}

	stop() {
		return this.server.stop();
	}
}

module.exports = HttpEndpoint;
