'use strict';

class ServicesList {
	constructor(atrix) {
		this.atrix = atrix;
		this.services = {};
	}

	addService(service) {
		this.services[service.name] = service;
		service.setAtrix(this.atrix); // eslint-disable-line
	}

	stop() {
		return Promise.all(this.services.map(e => e.instance.stop()));
	}
}

module.exports = ServicesList;
