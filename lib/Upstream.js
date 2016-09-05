'use strict';
const bb = require('bluebird');
const fetchLib = require('fetch');
const fetch = bb.promisify(fetchLib.fetchUrl, {multiArgs: true});

class Upstream {
	constructor(name, config) {
		this.name = name;
		this.config = config;
	}

	get(path, queryParams) {
		var url = `${this.config.url}${path}${this.buildQueryString(queryParams)}`;
		let opts = {
			timeout: 1000
		};

		return fetch(url, opts).then(result => {
			return {
				status: result[0].status,
				header: result[0].responseHeaders,
				body: JSON.parse(result[1].toString())
			};
		}).catch(err => {
			return {
				error: err
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
