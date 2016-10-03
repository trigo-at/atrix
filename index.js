'use strict';
const Service = require('./lib/Service');
const servicesList = require('./lib/ServicesList');
const Upstream = require('./lib/Upstream');

module.exports = {
	Service: Service,
	addService: servicesList.addService,
	services: servicesList.services,
	Upstream: Upstream,
};
