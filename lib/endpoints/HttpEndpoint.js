'use strict';
const Hapi = require('hapi');
const atrix = require('../../');

class HttpEndpoint {
	constructor(service, config) {
		this.config = config;
		this.server = new Hapi.Server();
		this.server.connection({ port: config.port });
		this.service = service;

		this.isSecured = !!this.service.config.config.security && this.service.config.config.security.strategies.jwt;

		this.server.register(require('inert'), (err) => {
			if (err) throw err;
			if (this.isSecured) {
				this.server.register(require('hapi-auth-jwt'), (err) => {
					this.server.auth.strategy('jwt', 'jwt', {
						key: this.service.config.config.security.strategies.jwt.secret,
						verifyOptions: { algorithms: [this.service.config.config.security.strategies.jwt.algorithm] }
					});
				});
			}
			else {
				this.service.log.info('nothing to secure here');
			}
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

	start(cb) {
		this.server.start(cb);
	}

	stop(cb) {
		this.server.stop(cb);
	}
}

module.exports = HttpEndpoint;
