'use strict';

class Logger {
	constructor(serviceName) {
		this.serviceName = serviceName;
	}

	info(msg) {
		console.log(`${this.serviceName}: ${msg}`);
	}
}

module.exports = Logger;
