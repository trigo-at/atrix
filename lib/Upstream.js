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
		var url = `${this.getUri(path)}${this.buildQueryString(queryParams)}`;
		return fetch(url).then(this.mapResult);
	}

	post(path, payload) {
		return fetch(this.getUri(path), {
			method: 'POST',
			payload: JSON.stringify(payload),
		})
		.then(this.mapResult);
	}

	getUri(path) {
		return `${this.config.url}${path}`;
	}

	mapResult(result) {
		const [response, responseBody] = result;
		let body = responseBody;
		try {
			if (response.status !== 204) {
				body = JSON.parse(responseBody.toString());
			}
		} catch(err) {
			body = responseBody.toString();
		}
		return {
			status: response.status,
			header: response.responseHeaders,
			body,
		};
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
