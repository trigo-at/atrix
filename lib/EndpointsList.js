'use strict';

const HttpEndpoint = require('./endpoints/HttpEndpoint');
const loadPlugin = require('./load-plugin');

class EndpointsList {
	constructor(service, config) {
		this.endpoints = [];
		this.config = config || {};
		this.service = service;
	}

	// TODO: completely remove in v7
	// eslint-disable-next-line
	add() {
		throw new Error('Obsolete API has been removed.');
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
			const endpointConfig = this.config[endpointName];
			if (endpointConfig && [false, 'false', '0', 0, 'off', ''].includes(endpointConfig.enabled)) {
				this.service.log.info(`Endpoint: ${endpointName} disabled`);
				return;
			}
			if (endpointName === 'http') {
				this.endpoints.push({ type: endpointName, instance: new HttpEndpoint(this.service, endpointConfig) });
				return;
			}
			const plugin = loadPlugin(this.service.atrix, endpointName, this.service);
			if (!plugin) return;
			const instance = plugin.factory(this.service.atrix, this.service, endpointConfig);
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
