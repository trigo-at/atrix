const bylog = require('bylog');

class Logger {
	constructor(serviceName, config = {}) {
		this.serviceName = serviceName;
		this.config = config;
		if (Object.keys(this.config).length === 0) {
			this.config.stdout = true;
		}
		this.logger = bylog.create(this.serviceName, config);
	}

	info(...args) {
		this.logger.info(...args);
	}

	warn(...args) {
		this.logger.warn(...args);
	}

	error(...args) {
		this.logger.error(...args);
	}
}

module.exports = Logger;
