'use strict';

const btoa = require('btoa');
const R = require('ramda');

class Basic {
	constructor(config) {
		this.username = config.username;
		this.secret = config.secret;
	}

	authorize(fetchOptions) {
		const fo = R.clone(fetchOptions);
		fo.headers = fetchOptions.headers || {};
		fo.headers.Authorization = `Basic ${btoa(
			`${this.username}:${this.secret}`
		)}`;
		return Promise.resolve(fo);
	}
}

module.exports = Basic;
