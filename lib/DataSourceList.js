'use strict';

const loadPlugin = require('./load-plugin');

class DataSourceList {
	constructor(service, config) {
		this.service = service;
		this.dataSources = config;
		this.connections = {};
	}

	setAtrix(atrix) {
		this.atrix = atrix;
	}

	async start() {
		if (!this.dataSources) { return; }
		const tasks = Object.keys(this.dataSources).map((key) => {
			const plugin = loadPlugin(this.atrix, this.dataSources[key].type, this.service);
			const instance = plugin.factory(this.atrix, this.service, this.dataSources[key].config, this.service);
			return instance.start()
				.then((connection) => {
					this.connections[key] = connection;
				});
		});
		if (!tasks.length) { return; }

		await Promise.all(tasks);
	}
}

module.exports = DataSourceList;
