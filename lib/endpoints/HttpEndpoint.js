const Hapi = require('hapi');

class HttpEndpoint {
	constructor(config) {
		this.server = new Hapi.Server();
		this.server.connection({ port: config.port });
	}

	registerHandler(method, path, handler, config) {
		this.server.route({
			method,
			path,
			handler,
			config,
		});
	}

	start(cb) {
		this.server.register(require('inert'), (err) => {
			if (err) throw err;
			this.server.start(cb);
		});
	}

	stop(cb) {
		this.server.stop(cb);
	}
}

module.exports = HttpEndpoint;
