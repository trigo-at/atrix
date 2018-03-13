'use strict';

const R = require('ramda');
const Hapi = require('hapi');
const Boom = require('boom');
const resolveHandlers = require('./resolve-handlers');
const inert = require('inert');
const Blipp = require('blipp');
const HapiBunyan = require('./HapiBunyan');
const HapiRequestLogger = require('./HapiRequestLogger');
const hapiAuthJwt = require('hapi-auth-jwt');
const hapiAuthSignedLink = require('@trigo/hapi-auth-signedlink');

class HttpEndpoint {
	constructor(service, config) {
		this.handlers = [];
		this.service = service;
		this.config = config;
		this.log = this.service.log.createLogger(
			this.config.logger || {
				name: this.service.name,
			}
		);
		this.createServer();
		this.setupRequestInterface();
		this.routeProcessors = [];

		this.isSecured =
			!!this.service.config.config.security &&
			this.service.config.config.security.strategies;
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
				additionalHeaders: [
					'access-control-allow-origin',
					'authorization',
					'content-type',
				],
				credentials: true,
			};
		} else if (typeof this.config.cors === 'object') {
			routesCfg.cors = R.clone(this.config.cors);
		}
		cfg.routes = routesCfg;

		this.log.debug('Hapi Connection:', JSON.stringify(cfg, null, 2));
		this.server.connection(cfg);
	}

	setupRequestInterface() {
		this.service.request = async options => {
			const opts = Object.assign({}, options);
			if (this.config.prefix) {
				opts.url = `${this.config.prefix}${opts.url}`;
			}
			const res = await this.server.inject(opts);
			const retval = R.omit(['res', 'req', 'request', 'raw'], res);
			return retval;
		};
	}

	async setupServer() {
		await this.server.register(inert);
		await this.server.register({
			register: Blipp,
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
		if (
			this.service.config.config.endpoints.http.requestLogger &&
			this.service.config.config.endpoints.http.requestLogger.enabled
		) {
			const options = Object.assign(
				{logFullRequest: true, logFullResponse: true},
				this.service.config.config.endpoints.http.requestLogger
			);

			await this.server.register({
				register: HapiRequestLogger.register,
				options,
			});
		}
		if (this.isSecured) {
			if (this.service.config.config.security.strategies.signedlink) {
				await this.server.register(hapiAuthSignedLink);
				this.server.auth.strategy('signedlink', 'signedlink', {
					key: this.service.config.config.security.strategies
						.signedlink.secret,
				});
				this.service.createSignedLink = this.server.plugins.hapiAuthSignedlink.createLink;
			}
			if (this.service.config.config.security.strategies.jwt) {
				await this.server.register(hapiAuthJwt);
				this.server.auth.strategy('jwt', 'jwt', {
					key: this.service.config.config.security.strategies.jwt
						.secret,
					verifyOptions: {
						algorithms: [
							this.service.config.config.security.strategies.jwt
								.algorithm,
						],
					},
				});
			}
		}

		if (this.config.handlerDir) {
			resolveHandlers(this.config.handlerDir, this.service).forEach(
				handler => {
					this.registerHandler(
						handler.method,
						handler.path,
						handler.handler,
						handler.config
					);
				}
			);
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
			if (
				Array.isArray(this.service.config.config.security.endpoints) &&
				this.service.config.config.security.strategies.jwt
			) {
				const endpointPattern = this.service.config.config.security.endpoints.map(
					x => new RegExp(x)
				);
				if (
					this.isSecured &&
					endpointPattern.some(x => path.match(x))
				) {
					this.service.log.debug(`JWT secured endpoint: ${path}`);
					config.auth = {
						strategy: 'jwt',
					};
				}
			} else {
				if (this.service.config.config.security.endpoints.jwt) {
					const endpointPattern = this.service.config.config.security.endpoints.jwt.map(
						x => new RegExp(x)
					);
					if (
						this.isSecured &&
						endpointPattern.some(x => path.match(x))
					) {
						this.service.log.debug(`JWT secured endpoint: ${path}`);
						config.auth = {
							strategy: 'jwt',
						};
					}
				}
				if (this.service.config.config.security.endpoints.signedlink) {
					const endpointPattern = this.service.config.config.security.endpoints.signedlink.map(
						x => new RegExp(x)
					);
					if (
						this.isSecured &&
						endpointPattern.some(x => path.match(x))
					) {
						if (config.auth) {
							throw new Error(
								`CONFIGURATION ERROR: Route: "${path}" cannot be secured using "signedlink" strategy. It is already secured with: "${
									config.auth.strategy
								}" strategy.`
							); //eslint-disable-line
						}
						this.service.log.debug(
							`signedlink secured endpoint: ${path}`
						);
						config.auth = {
							strategy: 'signedlink',
						};
					}
				}
			}
		}

		const finalPath = this.config.prefix
			? `${this.config.prefix}${path}`
			: path;

		this.handlers.push({
			method,
			path: finalPath,
			handler: async (req, reply) => {
				try {
					reply.withEvent = async (data, status = 200) => {
						// eslint-disable-line
						if (this.service.plugins.pubsub) {
							await this.service.plugins.pubsub.publishHttpReply(
								req,
								data,
								status,
								this.config.prefix
							);
						} else {
							this.service.log.warn(
								'@trigo/atrix-pubsub not installed and/or configured. No Event will be published'
							);
						}

						if (data === null) {
							reply().code(status);
						} else {
							reply(data).code(status);
						}
					};
					await handler(req, reply, this.service);
				} catch (e) {
					let error = e;
					if (!(e instanceof Error)) {
						this.service.log.warn('Non-Error Object thrown!');
						error = new Error(e);
					}
					reply(Boom.wrap(error));
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
		this.log.info(
			`Service "${this.service.name}" started on ${this.server.info.uri}`
		);
	}

	stop() {
		return this.server.stop();
	}
}

module.exports = HttpEndpoint;
