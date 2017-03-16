'use strict';

const Hapi = require('hapi');
const Boom = require('boom');
const resolveHandlers = require('./resolve-handlers');
const inert = require('inert');
const Blipp = require('blipp');
const HapiBunyan = require('./HapiBunyan');
const hapiAuthJwt = require('hapi-auth-jwt');

class HttpEndpoint {
	constructor(service, config) {
		this.handlers = [];
		this.config = config;
		this.server = new Hapi.Server();
		this.server.connection({
			port: config.port,
			routes: {
				cors: this.config.cors,
			},
		});
		this.service = service;

		this.log = this.service.log.createLogger(this.config.logger || {
			name: this.service.name,
		});

		this.log.debug('HttpEndpoint.cors=', this.config.cors);

		this.routeProcessors = [];

		this.isSecured = !!this.service.config.config.security && this.service.config.config.security.strategies.jwt;
	}

	async setupServer() {
		await this.server.register(inert);
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

		if (this.isSecured) {
			await this.server.register(hapiAuthJwt);
			this.server.auth.strategy('jwt', 'jwt', {
				key: this.service.config.config.security.strategies.jwt.secret,
				verifyOptions: {
					algorithms: [this.service.config.config.security.strategies.jwt.algorithm],
				},
			});
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

		this.server.route(this.handlers);

		this.configured = true;
		return true;
	}

	registerRouteProcessor(processor) {
		if (this.routeProcessors.indexOf(processor) !== -1) {
			throw new Error('Duplicate routeProcessor registration');
		}
		this.log.info('Registred route processor:', processor);
		this.routeProcessors.push(processor);
	}

	registerHandler(method, path, handler, cfg) {
		const config = cfg || {};
		if (this.service.config.config.security) {
			const endpointPattern = this.service.config.config.security.endpoints.map(x => new RegExp(x));
			if (this.isSecured && endpointPattern.some(x => path.match(x))) {
				this.service.log.debug(`JWT secured endpoint: ${path}`);
				config.auth = {
					strategy: 'jwt',
				};
			}
		}


		this.handlers.push({
			method,
			path,
			handler: async (req, reply) => {
				try {
					reply.withEvent = async (data, status = 200) => { // eslint-disable-line
						if (this.service.plugins.pubsub) {
							await this.service.plugins.pubsub.publishHttpReply(req, data, status);
						} else {
							this.service.log.warn('@trigo/atrix-pubsub not installed and/or configured. No Event will be published');
						}

						if (data === null) {
							reply().code(status);
						} else {
							reply(data).code(status);
						}
					};
					await handler(req, reply, this.service);
				} catch (e) {
					reply(Boom.wrap(e));
				}
			},
			config,
		});
	}

	async start() {
		if (!this.configured) {
			await this.setupServer();
		}

		await this.server.start();
		this.log.info(`Serivce "${this.service.name}" started on ${this.server.info.uri}`);
	}

	stop() {
		return this.server.stop();
	}
}

module.exports = HttpEndpoint;
