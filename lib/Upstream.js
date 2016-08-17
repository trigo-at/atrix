'use strict';
const bb = require('bluebird');
const fetchLib = require('fetch');
const fetch = bb.promisify(fetchLib.fetchUrl, {multiArgs: true});

class Upstream {
	constructor(config) {
		this.config = config;
	}

	get(path) {
		var url = `${this.config.url}${path}`;
		return fetch(url).then(result => {
			return {
				status: result[0].status,
				header: result[0].responseHeaders,
				body: JSON.parse(result[1].toString())
			};
		});
	}
}

module.exports = Upstream;
