'use strict';

const Service = require('./lib/Service');
const ServicesList = require('./lib/ServicesList');
const Upstream = require('./lib/Upstream');
const globalConfig = require('./lib/global-config');
const configure = require('./configure');


class Atrix {
	constructor() {
		this.ServiceConstructor = Service;
		this.UpsteamConstructor = Upstream;
		this.servicesList = new ServicesList(this);
		this.globalConfig = globalConfig();

		process.on('unhandledRejection', (err) => {
			console.error(err);
			process.exit(1);
		});

		process.on('SIGINT', async () => {
			await this.servicesList.stop();
			process.exit(0);
		});

		process.on('SIGTERM', async () => {
			await this.servicesList.stop();
			process.exit(0);
		});
	}

	get Service() {
		return this.ServiceConstructor;
	}

	get Upstream() {
		return this.UpsteamConstructor;
	}

	addService(service) {
		this.servicesList.addService(service);
	}

	get services() {
		return this.servicesList.services;
	}

	get config() {
		return this.globalConfig;
	}

	get configure() {
		return configure(this.globalConfig);
	}
}

module.exports = Atrix;
