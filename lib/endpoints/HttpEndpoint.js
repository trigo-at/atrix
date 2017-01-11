'use strict';
const Hapi = require('hapi');
const atrix = require('../../');
const Logger = require('../BunyanLogger');

class HttpEndpoint {
	constructor(service, config) {
		this.config = config;
		this.server = new Hapi.Server();
		this.server.connection({ port: config.port });
		this.service = service;

		this.log = this.service.log.createLogger(this.config.logger || { name: this.service.name });
		this.isSecured = !!this.service.config.config.security && this.service.config.config.security.strategies.jwt;

		console.log(this.config);
	}

	setupServer() {

		const tasks = [];
		tasks.push(this.server.register(require('inert')));
		tasks.push(this.server.register({
			register: require('./HapiBunyan').register,
			options: {
				logger: this.log
			}
		}));

		if (this.isSecured) {
			tasks.push(this.server.register(require('hapi-auth-jwt')).then(() => {
				this.server.auth.strategy('jwt', 'jwt', {
					key: this.service.config.config.security.strategies.jwt.secret,
					verifyOptions: { algorithms: [this.service.config.config.security.strategies.jwt.algorithm] }
				});
			}));
		}


		return Promise.all(tasks).then(() => {
			this.configured = true;
			return true;
		});
	}

	registerHandler(method, path, handler, config) {
		if (this.service.config.config.security) {
			let endpointPattern = this.service.config.config.security.endpoints.map(x => new RegExp(x));
			config = config || {};
			if (this.isSecured && endpointPattern.some(x => path.match(x))) {
				this.service.log.info('securing an endpoint ' + path);
				config.auth = {
					strategy: 'jwt'
				};
			}
		}
		this.server.route({
			method,
			path,
			handler,
			config,
		});
	}

	start() {
		let startPromise = new Promise((resolve) => { resolve(); });
		if(!this.configured) {
			startPromise = this.setupServer();
		}

		return startPromise.then(() => {
			return this.server.start()
				.then(() => {
					this.log.info(`Serivce "${this.service.name}" started on ${this.server.info.uri}`)
				});
		}) ;
	}

	stop() {
		return this.server.stop();
	}
}

module.exports = HttpEndpoint;
