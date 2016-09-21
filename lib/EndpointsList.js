'use strict';
const HttpEndpoint = require('./endpoints/HttpEndpoint');

class EndpointsList {
	constructor(service, config) {
		this.endpoints = [];
		this.config = config;
		this.service = service;
	}

	init() {
	}

	add(endpointDefinition) {
		var config = this.config[endpointDefinition];
		this.endpoints.push({ type: endpointDefinition, instance: new HttpEndpoint(this.service, config) });
	}

	get(endpointType) {
		return this.endpoints.find(x => x.type === endpointType);
	}

	registerHandler(method, path, handler, config) {
		this.endpoints.forEach(e => {
			e.instance.registerHandler(method, path, handler, config);
		});
	}

	start(cb) {
		this.endpoints.forEach(e => {
			e.instance.start(cb);
		});
	}

	stop(cb) {
		this.endpoints.forEach(e => {
			e.instance.stop(cb);
		});
	}
}

module.exports = EndpointsList;
