'use strict';

const Upstream = require('./Upstream');

class UpstreamList {
	constructor(config) {
		if (typeof config === 'object') {
			Object.keys(config).forEach(key => {
				this[key] = new Upstream(key, config[key]);
			});
		}
	}
}

module.exports = UpstreamList;
