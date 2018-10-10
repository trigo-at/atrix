'use strict';

/* eslint max-len: 0 */

const loadPlugin = require('./load-plugin');
const Joi = require('joi');

const dataSourceSchema = Joi.object({
	type: Joi.string().required().description('the type of thr datasource. Atrix search es for a plugin module named "atrix-<type>" to load the coresponding plugin'),
	config: Joi.object().required().description('the configuration object for the datasource plugin'),
});

class DataSourceList {
	constructor(service, config) {
		this.service = service;
		this.dataSources = config;
		this.connections = {};
		this.pluginModules = [];
	}

	setAtrix(atrix) {
		this.atrix = atrix;
		this.loadPluginModules();
	}

	loadPluginModules() {
		if (!this.dataSources) { return; }

		Object.keys(this.dataSources).forEach((configKey) => {
			Joi.assert(this.dataSources[configKey], dataSourceSchema);

			const plugin = loadPlugin(this.atrix, this.dataSources[configKey].type, this.service);
			this.pluginModules.push({
				plugin,
				configKey,
			});
		});
	}

	async start() {
		const tasks = this.pluginModules.map((p) => {
			const instance = p.plugin.factory(this.atrix, this.service, this.dataSources[p.configKey].config, this.service);
			if (!instance.start || typeof instance.start !== 'function') {
				throw new TypeError(`data source plugin: ${p.configKey} of type: ${this.dataSources[p.configKey].type} does not define a "start()" method`);
			}
			return instance.start()
				.then((connection) => {
					if (!connection) {
						throw new Error(`data source plugin: ${p.configKey} of type: ${this.dataSources[p.configKey].type} did not return a connection object from "start()" method`);
					}
					this.connections[p.configKey] = connection;
				});
		});

		if (!tasks.length) { return; }

		await Promise.all(tasks);
	}
}

module.exports = DataSourceList;
