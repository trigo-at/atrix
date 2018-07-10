'use strict';

const axios = require('axios');
const R = require('ramda');

class OAuth {
	constructor(config) {
		this.config = config;
	}

	authorize(fetchOptions) {
		return new Promise((resolve, reject) => {
			const options = R.clone(fetchOptions);
			if (!this.access_token) {
				this.getToken()
					.then(() => {
						options.headers = options.headers || {};
						options.headers.Authorization = `Bearer ${this.access_token}`;
						resolve(options);
					})
					.catch(err => reject(err));
			} else {
				options.headers = options.headers || {};
				options.headers.Authorization = `Bearer ${this.access_token}`;
				resolve(options);
			}
		});
	}

	getToken() {
		const { authEndpoint, clientId, clientSecret, grantType } = this.config;
		return axios({
			url: authEndpoint,
			method: 'POST',
			auth: {
				username: clientId,
				password: clientSecret,
			},
			headers: {
				'Content-Type': 'application/json',
			},
			data: {
				grant_type: grantType,
				username: clientId,
			},
		})
			.then((response) => {
				this.access_token = response.data.access_token;
				this.refresh_token = response.data.refresh_token;
			});
	}
}

module.exports = OAuth;
