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

	start() {
		return Promise.all(this.endpoints.map(e => {
			return e.instance.start();
		}));
	}

	stop() {
		return Promise.all(this.endpoints.map(e => {
			return e.instance.stop();
		}));
	}
}

module.exports = EndpointsList;
