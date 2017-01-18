'use strict';

const loadPlugin = require('./load-plugin');

class DataSourceList {
	constructor(config) {
		this.dataSources = config;
	}

	setAtrix(atrix) {
		this.atrix = atrix;
	}

	async start() {
		Object.keys(this.dataSources).forEach(async key => {
			console.log(`Loading Datasource: ${JSON.stringify(this.dataSources[key], null, 2)}`);
			const plugin = loadPlugin(this.atrix, this.dataSources[key].type);
			const instance = plugin.factory(this.atrix, this.dataSources[key].config);
			await instance.start();
		});
	}
}

module.exports = DataSourceList;
