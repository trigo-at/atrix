'use strict';

const {clone, omit} = require('ramda');
const symbols = require('../symbols');
const Hapi = require('hapi');
const Boom = require('boom');
const inert = require('inert');
const h2o2 = require('h2o2');
const Blipp = require('blipp');
const hapiAuthJwt2 = require('hapi-auth-jwt2');
const hapiAuthBasic = require('hapi-auth-basic');
const hapiAuthSignedLink = require('@trigo/hapi-auth-signedlink');
const Joi = require('joi');
const debug = require('debug')('@trigo/atrix:http-endpoint');
const HapiRequestLogger = require('./HapiRequestLogger');
const HapiBunyan = require('./HapiBunyan');
const resolveHandlers = require('./resolve-handlers');
const validationFailAction = require('./validation-fail-action');

const NODE_ENV = process.env.NODE_ENV;

const SecuritySchema = Joi.object({
    strategies: Joi.object({
        jwt: Joi.object({
            secret: Joi.string().description(
                'The secret key for symetric or the public key for RSA based token validation'
            ),
            algorithm: Joi.string()
                .default('HS256')
                .description('the algorithm used to verify the tokens'),
        }).description('configuration for jwt auth strategy'),
        signedlink: Joi.object({
            secret: Joi.string().description('The secret to sign the links with'),
            failAction: Joi.func().description('A custom fail action'),
        }).description('configuration for signedlink auth strategy'),
        basic: Joi.object({
            validate: Joi.func()
                .required()
                .description(
                    'function to check the user credentials. async (request: Hapi.Request, username: String, password: Password) => {isValid: true|false, creadentials: {...}}'
                ),
            allowEmptyUsername: Joi.boolean()
                .default(false)
                .description('whether to allow empty usernames'),
        }).description('configure basic auth'),
    }).description('Auth strategies to use in the service'),
    endpoints: Joi.alternatives()
        .try(
            Joi.array()
                .items(Joi.string())
                .description('DEPRECATED: list of route expression where the jwt should be applied'),
            Joi.object({
                jwt: Joi.array().items(Joi.string()),
                signedlink: Joi.array().items(Joi.string()),
                basic: Joi.array().items(Joi.string()),
            })
        )
        .description('list of route expression where the strategies should be applied'),
});

const configSchema = Joi.object({
    enabled: Joi.boolean()
        .default(true)
        .description('whether the endpoint should be started'),
    port: Joi.number()
        .integer()
        .default(3000)
        .description('the port the server listens'),
    handlerDir: Joi.string().description('the local dirctory containing the route handler files'),
    prefix: Joi.string()
        .allow('')
        .description('a prefix path prepended to all routes (e.g. when running behind rewrite proxy)'),
    cors: Joi.alternatives().try(
        Joi.boolean().description('when true CORS will be globally enabled withourt any origin restrictions'),
        Joi.object({
            origin: Joi.array()
                .items(Joi.string())
                .description('list of allowed origins'),
            additionalHeaders: Joi.array()
                .items(Joi.string())
                .description('list of additional headers'),
            credentials: Joi.boolean()
                .default(true)
                .description('aloows user credentials to be sent "Access-Control-Allow-Credentials"'),
        })
    ),
    requestLogger: Joi.object({
        enabled: Joi.boolean()
            .default(false)
            .description('wheter the request logger should be enabled'),
        logFullRequest: Joi.boolean()
            .default(true)
            .description('whether to log the full request data'),
        logFullResponse: Joi.boolean()
            .default(true)
            .description('wheter to log the full response data'),
        ignoreEndpoints: Joi.array()
            .items(Joi.string())
            .default(['^/alive$'])
            .description('list of expressions for endpoints that should not be logged'),
    })
        .description('the request logger configuration')
        .default({
            enabled: false,
            logFullRequest: true,
            logFullResponse: true,
            ignoreEndpoints: ['^/alive$'],
        }),
    validation: Joi.object({
        verboseEndpoints: Joi.array()
            .items(Joi.string())
            .default([])
            .description(
                'list of route expressions for endpoints that return full detailes in error response when validation rules fail'
            ),
        strictEndpoints: Joi.array()
            .items(Joi.string())
            .default(['.*'])
            .description(
                'list of route expression that enforce strict validation rules. E.g. do not allow unknown payload keys. When this is disabled for a route unk nown keys are allowed but stripped from the object thatb is being passed to the hanlder'
            ),
    })
        .description('The validation settings')
        .default({
            verboseEndpoints: [],
            strictEndpoints: ['.*'],
        }),
});


class HttpEndpoint {
    constructor(service, config) {
        this.handlers = [];
        this.service = service;
        this.log = this.service.log.child({endpoint: 'http'});

        // => <CONFIG>.endpoints.http: { ... }
        this.config = Joi.attempt(config, configSchema);
        debug('Ednpoint configuration:', this.config);

        // => <CONFIG>.security: { ... }
        this.securityConfig = Joi.attempt(this.service.config.config.security, SecuritySchema);
        debug('Security configuration:', this.securityConfig);


        this.createServer();
        this.setupRequestInterface();
        this.routeProcessors = [];

        this.isSecured = !!this.securityConfig && this.securityConfig.strategies;
    }

    createServer() {
        const cfg = {
            port: this.config.port,
        };
        const routesCfg = {
            validate: {},
        };
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
        this.server = new Hapi.Server(cfg);
    }

    setupRequestInterface() {
        this.service.request = async (options, parentRequest) => {
            const opts = Object.assign({}, options);
            if (!opts.headers) {
                opts.headers = {};
            }
            if (parentRequest && parentRequest.info && parentRequest.info.id && parentRequest.headers) {
                if (parentRequest.headers['x-atrix-context-req-id']) {
                    opts.headers['x-atrix-context-req-id'] = parentRequest.headers['x-atrix-context-req-id'];
                } else {
                    opts.headers['x-atrix-context-req-id'] = parentRequest.info.id;
                }
                opts.headers['x-atrix-parent-req-id'] = parentRequest.info.id;
            } else {
                this.service.log.warn(
                    `Calling "service.request" without "parentRequest" paramater! ${opts.method} ${opts.url}`
                );
            }
            if (this.config.prefix) {
                opts.url = `${this.config.prefix}${opts.url}`;
            }
            const res = await this.server.inject(opts);
            const retval = omit(['res', 'req', 'request', 'raw'], res);
            return retval;
        };
    }

    async setupAuthStrategies() {
        if (this.isSecured) {
            if (this.securityConfig.strategies.signedlink) {
                await this.server.register(hapiAuthSignedLink);
                const options = {
                    key: this.securityConfig.strategies.signedlink.secret,
                };
                if (this.securityConfig.strategies.signedlink.failAction) {
                    options.failAction = this.securityConfig.strategies.signedlink.failAction;
                }
                this.server.auth.strategy('signedlink', 'signedlink', options);
                this.service.createSignedLink = this.server.plugins.hapiAuthSignedlink.createLink;
            }
            if (this.securityConfig.strategies.jwt) {
                await this.server.register(hapiAuthJwt2);
                this.server.auth.strategy('jwt', 'jwt', {
                    key: this.securityConfig.strategies.jwt.secret,
                    validate: () => {
                        return {isValid: true};
                    },
                    verifyOptions: {
                        algorithms: [this.securityConfig.strategies.jwt.algorithm],
                    },
                });
            }
            if (this.securityConfig.strategies.basic) {
                await this.server.register(hapiAuthBasic);
                const cfg = this.securityConfig.strategies.basic;

                this.server.auth.strategy('basic', 'basic', cfg);
            }
        }
    }

    async setupServer() {
        this.server.app[symbols.ATRIX_SERVICE] = this.service;
        await this.server.register(inert);
        await this.server.register(h2o2);
        await this.server.register({
            plugin: Blipp,
            options: {
                showAuth: true,
                showStart: true,
            },
        });
        await this.server.register({
            plugin: HapiBunyan,
            options: {
                logger: this.log,
            },
        });
        if (this.config.requestLogger && this.config.requestLogger.enabled) {
            const options = Object.assign({logFullRequest: true, logFullResponse: true}, this.config.requestLogger);

            await this.server.register({
                plugin: HapiRequestLogger,
                options,
            });
        }

        await this.setupAuthStrategies();

        if (this.config.handlerDir) {
            resolveHandlers(this.config.handlerDir, this.service).forEach(handler => {
                this.registerHandler(handler.method, handler.path, handler.handler, handler.options);
            });
        }

        for (const processor of this.routeProcessors) {
            await processor.init();
            await processor.process(this.handlers);
        }

        this.server.ext('onRequest', async (request, h) => {
            if (!request.headers['x-atrix-context-req-id']) {
                request.headers['x-atrix-context-req-id'] = request.info.id;
            }
            return h.continue;
        });
        this.server.ext('onPostHandler', async (request, h) => {
            if (request.plugins.AtrixPubsubPublishEventData) {
                const {data, status} = request.plugins.AtrixPubsubPublishEventData;
                if (this.service.plugins.pubsub) {
                    this.service.plugins.pubsub.publishHttpReply(request, data, status, this.config.prefix);
                } else {
                    this.service.log.warn(
                        '@trigo/atrix-pubsub not installed and/or configured. No Event will be published'
                    );
                }
            }
            return h.continue;
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
            if (Array.isArray(this.securityConfig.endpoints)) {
                this.log.warn(`Deprecated Security Config Format:
security: {
    strategies: { ... },
    endpoints = [<REGEX>, ...],
}

Please use the stragety specific endpoint configuration:
security: {
    strategies: { ... },
    endpoints: {
        jwt: ['/jwt-secured.*'],
        signedlink: ['/signedlink-secured.*'],
    }
}
                `);
            }
            if (
                Array.isArray(this.securityConfig.endpoints) &&
                (this.securityConfig.strategies.signedlink || this.securityConfig.strategies.basicauth)
            ) {
                const error = new Error(
                    'Invalid endpoints: [<RegExp>,..] configuration. With stragety other then jwt defined'
                );
                this.log.error(error);
                throw error;
            }
            if (Array.isArray(this.securityConfig.endpoints) && this.securityConfig.strategies.jwt) {
                const endpointPattern = this.securityConfig.endpoints.map(x => new RegExp(x));
                if (this.isSecured && endpointPattern.some(x => path.match(x))) {
                    this.service.log.debug(`JWT secured endpoint: ${path}`);
                    config.auth = {
                        strategy: 'jwt',
                    };
                }
            } else {
                ['jwt', 'signedlink', 'basic'].forEach(strategy => {
                    if (this.securityConfig.endpoints[strategy]) {
                        const endpointPattern = this.securityConfig.endpoints[strategy].map(x => new RegExp(x));
                        if (this.isSecured && endpointPattern.some(x => path.match(x))) {
                            if (config.auth && config.auth.strategy !== strategy) {
                                throw new Error(
                                    `CONFIGURATION ERROR: Route: "${path}" cannot be secured using "${strategy}" strategy. It is already secured with: "${
                                        config.auth.strategy
                                    }" strategy.`);
                            }
                            this.service.log.debug(`${strategy} secured endpoint: ${path}`);
                            config.auth = {
                                strategy,
                            };
                        }
                    }
                });
            }
        }
        if (this.config.validation) {
            if (!config.validate) config.validate = {};
            if (!config.validate.options) config.validate.options = {};

            if (this.config.validation.verboseEndpoints) {
                const endpointPattern = this.config.validation.verboseEndpoints.map(x => new RegExp(x));
                if (endpointPattern.some(x => path.match(x))) {
                    this.service.log.debug(`Enable verbose validations on endpoint: ${path}`);
                    config.validate.options.abortEarly = false;
                    config.validate.failAction = validationFailAction;
                }
            }
            if (this.config.validation.strictEndpoints) {
                const endpointPattern = this.config.validation.strictEndpoints.map(x => new RegExp(x));
                if (endpointPattern.some(x => path.match(x))) {
                    this.service.log.debug(`Disable strict validations on endpoint: ${path}`);
                    config.validate.options.allowUnknown = false;
                    config.validate.options.stripUnknown = false;
                } else {
                    this.service.log.debug(`Enable strict validations on endpoint: ${path}`);
                    config.validate.options.allowUnknown = true;
                    config.validate.options.stripUnknown = true;
                }
            }
        }
        return config;
    }

    setupProxyHandler(handler) {
        const requestHandler = {proxy: {}};
        if (handler.proxy.mapUri) {
            requestHandler.proxy.mapUri = async request => {
                const mapUriResult = await handler.proxy.mapUri(request, this.service);
                if (typeof mapUriResult === 'string') {
                    return {
                        uri: mapUriResult,
                    };
                }
                return {
                    uri: mapUriResult.uri,
                    headers: mapUriResult.headers,
                };
            };
        }
        if (handler.proxy.onResponse) {
            requestHandler.proxy.onResponse = async (err, res, request, h, settings, ttl) => {
                let result;
                const reply = response => {
                    // console.log('Called reply()', response)
                    result = h.response(response);
                    return result;
                };
                reply.withEvent = (data, status = 200) => {
                    request.plugins.AtrixPubsubPublishEventData = {data, status};
                    if (data === null) {
                        result = h.response().code(status);
                    } else {
                        result = h.response(data).code(status);
                    }
                };

                const handlerResult = await handler.proxy.onResponse(
                    err,
                    res,
                    request,
                    reply,
                    settings,
                    ttl,
                    this.service
                );
                if (handlerResult !== undefined) {
                    return handlerResult;
                }
                return result;
            };
        }
        if (handler.proxy.onRequest) {
            requestHandler.proxy.onRequest = async req => {
                await handler.proxy.onRequest(req, this.service);
            };
        }

        [
            'host',
            'port',
            'protocol',
            'uri',
            'passThrough',
            'localStatePassThrough',
            'acceptEncoding',
            'rejectUnauthorized',
            'xforward',
            'redirects',
            'timeout',
            'ttl',
            'agent',
            'maxSockets',
            'secureProtocol',
            'ciphers',
        ].forEach(prop => {
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
        return async (req, h) => {
            try {
                let result;
                const reply = response => {
                    result = h.response(response);
                    return result;
                };
                reply.withEvent = (data, status = 200) => {
                    req.plugins.AtrixPubsubPublishEventData = {data, status};
                    if (data === null) {
                        result = h.response().code(status);
                    } else {
                        result = h.response(data).code(status);
                    }
                };

                const handlerResult = await handler(req, reply, this.service);
                if (handlerResult !== undefined) {
                    return handlerResult;
                }
                return result;
            } catch (e) {
                let error = e;
                if (!(e instanceof Error)) {
                    this.service.log.warn('Non-Error Object thrown!');
                    error = new Error(e);
                }

                if (NODE_ENV === 'test' && !(e.isBoom && e.output.statusCode < 500)) {
                    // eslint-disable-next-line no-console
                    console.error(error.stack);
                } else {
                    req.log.error(error);
                }
                throw Boom.boomify(error);
            }
        };
    }

    registerHandler(method, path, handler, cfg) {
        const options = this.createRouteConfig(path, cfg);
        const finalPath = this.config.prefix ? `${this.config.prefix}${path}` : path;

        this.handlers.push({
            method,
            path: finalPath,
            handler: this.setupRouteHandler(handler),
            options,
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
