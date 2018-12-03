'use strict';

const HttpEndpoint = require('./endpoints/HttpEndpoint');
const loadPlugin = require('./load-plugin');

class EndpointsList {
	constructor(service, config) {
		this.endpoints = [];
		this.config = config || {};
		this.service = service;
	}

	add(endpointName) {
		throw new Error('REMOVE ME');
		// if (endpointName === 'http') {
			// const config = this.config[endpointName];
			// this.endpoints.push({ type: endpointName, instance: new HttpEndpoint(this.service, config) });
			// return;
		// }
		// const plugin = loadPlugin(this.service.atrix, endpointName, this.service);
		// if (!plugin) return;
		// const instance = plugin.factory(this.service.atrix, this.service, this.config[endpointName]);
		// this.endpoints.push({ type: endpointName, instance });
	}

	get(endpointType) {
		return this.endpoints.find(x => x.type === endpointType);
	}

	registerHandler(method, path, handler, config) {
		this.endpoints.forEach((e) => {
			e.instance.registerHandler(method, path, handler, config);
		});
	}

	loadEndpointsConfig() {
		Object.keys(this.config).forEach((endpointName) => {
			if (endpointName === 'http') {
				const config = this.config[endpointName];
				this.endpoints.push({ type: endpointName, instance: new HttpEndpoint(this.service, config) });
				return;
			}
			const plugin = loadPlugin(this.service.atrix, endpointName, this.service);
			if (!plugin) return;
			const instance = plugin.factory(this.service.atrix, this.service, this.config[endpointName]);
			this.endpoints.push({ type: endpointName, instance });
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
