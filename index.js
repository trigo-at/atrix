'use strict';
const Service = require('./lib/Service');
const servicesList = require('./lib/ServicesList');
module.exports = {
	Service: Service,
	addService: servicesList.addService,
	services: servicesList.services,
};
