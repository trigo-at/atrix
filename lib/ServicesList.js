'use strict';
class ServicesList {
	constructor() {
		this.services = {};
	}
	addService(service) {
		this.services[service.name] = service;
	}
}

module.exports = new ServicesList();
