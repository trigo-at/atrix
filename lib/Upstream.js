'use strict';
const bb = require('bluebird');
const fetchLib = require('fetch');
const fetch = bb.promisify(fetchLib.fetchUrl, {multiArgs: true});

class Upstream {
	constructor(config) {
		this.config = config;
	}

	get(path, queryParams) {
		var url = `${this.config.url}${path}${this.buildQueryString(queryParams)}`;
		return fetch(url).then(result => {
			return {
				status: result[0].status,
				header: result[0].responseHeaders,
				body: JSON.parse(result[1].toString())
			};
		});
	}

	buildQueryString(queryParams) {
		if (queryParams && Object.keys(queryParams).length) {
			const queryString = Object.keys(queryParams).map(key => {
				return `${key}=${queryParams[key]}`;
			}).join('&')
			return `?${queryString}`;
		}
		return '';
	}
}

module.exports = Upstream;
