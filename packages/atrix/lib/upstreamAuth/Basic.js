const btoa = require('btoa');

class Basic {
	constructor(config) {
		this.username = config.username;
		this.secret = config.secret;
	}

	authorize(fetchOptions) {
		fetchOptions.headers = fetchOptions.headers || {};
		fetchOptions.headers.Authorization = `Basic ${btoa(`${this.username}:${this.secret}`)}`;
		return Promise.resolve(fetchOptions);
	}
}

module.exports = Basic;
