'use strict';
const Upstream = require('./Upstream');

class UpstreamList {
	constructor(config) {
		for (var key in config) {
			this[key] = new Upstream(config[key]);
		}
	}
}

module.exports = UpstreamList;
