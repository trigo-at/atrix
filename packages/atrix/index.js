'use strict';

const Service = require('./lib/Service');
const ServicesList = require('./lib/ServicesList');
const Upstream = require('./lib/Upstream');
const config = require('./lib/global-config');
const configure = require('./configure');


class Atrix {
	constructor() {
		this.ServiceConstructor = Service;
		this.UpsteamConstructor = Upstream;
		this.servicesList = new ServicesList(this);
		this.globalConfig = config;
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

module.exports = new Atrix();