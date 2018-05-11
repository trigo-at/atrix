'use strict';

const Upstream = require('./Upstream');

class UpstreamList {
	constructor(config, logger) {
		if (typeof config === 'object') {
			Object.keys(config).forEach((key) => {
				this[key] = new Upstream(key, config[key], logger);
			});
		}
	}
}

module.exports = UpstreamList;
