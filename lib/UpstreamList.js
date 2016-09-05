'use strict';
const Upstream = require('./Upstream');

class UpstreamList {
	constructor(config) {
		for (var key in config) {
			this[key] = new Upstream(key, config[key]);
		}
	}
}

module.exports = UpstreamList;
