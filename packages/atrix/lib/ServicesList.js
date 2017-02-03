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
		const serviceNames = Object.keys(this.services);
		return Promise.all(serviceNames.map(serviceName =>
			this.services[serviceName].instance.stop()),
		);
	}
}

module.exports = ServicesList;
