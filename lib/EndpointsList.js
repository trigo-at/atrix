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
		console.log(`Add endpoint: ${endpointDefinition}`);
		if (endpointDefinition === 'http') {
			console.log('HTTP ENDPOINT')
			const config = this.config[endpointDefinition];
			this.endpoints.push({ type: endpointDefinition, instance: new HttpEndpoint(this.service, config) });
			return;
		}
		console.log(`Load endpoint plugin: ${ endpointDefinition }`);
		const plugin = loadPlugin(this.service.atrix, endpointDefinition);
		if (!plugin) return;
		const instance = plugin.factory(this.service.atrix, this.service, this.config[endpointDefinition]);
		this.endpoints.push({ type: endpointDefinition, instance });
		// console.log(instance);
		// if (typeof instance.start === 'function') {
			// tasks.push(instance.start());
		// }
		// this.service.plugins[endpointDefinition] = instance;
		// console.log(this.service.atrix);
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
