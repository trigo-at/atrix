'use strict';

const HttpEndpoint = require('./endpoints/HttpEndpoint');
const loadPlugin = require('./load-plugin');

class EndpointsList {
	constructor(service, config) {
		this.endpoints = [];
		this.config = config;
		this.service = service;
	}

	add(endpointDefinition) {
		if (endpointDefinition === 'http') {
			const config = this.config[endpointDefinition];
			this.endpoints.push({ type: endpointDefinition, instance: new HttpEndpoint(this.service, config) });
			return;
		}
		const plugin = loadPlugin(this.service.atrix, endpointDefinition);
		if (!plugin) return;
		const instance = plugin.factory(this.service.atrix, this.service, this.config[endpointDefinition]);
		this.endpoints.push({ type: endpointDefinition, instance });
	}

	get(endpointType) {
		return this.endpoints.find(x => x.type === endpointType);
	}

	registerHandler(method, path, handler, config) {
		this.endpoints.forEach((e) => {
			e.instance.registerHandler(method, path, handler, config);
		});
	}

	start() {
		return Promise.all(this.endpoints.map(e => e.instance.start()));
	}

	stop() {
		return Promise.all(this.endpoints.map(e => e.instance.stop()));
	}
}

module.exports = EndpointsList;
