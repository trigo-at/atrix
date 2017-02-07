const bb = require('bluebird');
const fetchLib = require('fetch');
const btoa = require('btoa');
const R = require('ramda');
const mapResult = require('../map-result');
const respond = require('../respond');

const fetch = bb.promisify(fetchLib.fetchUrl, { multiArgs: true });

class OAuth {
	constructor(config) {
		this.config = config;
	}

	authorize(fetchOptions) {
		return new Promise((resolve, reject) => {
			const fo = R.clone(fetchOptions);
			if (!this.access_token) {
				this.getToken()
				.then(() => {
					fo.headers.Authorization = `Bearer ${this.access_token}`;
					resolve(fo);
				})
				.catch(err => reject(err));
			} else {
				fo.headers.Authorization = `Bearer ${this.access_token}`;
				resolve(fo);
			}
		});
	}

	getToken() {
		const { authEndpoint, clientId, clientSecret, grantType } = this.config;
		return fetch(authEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
				'Content-Type': 'application/json',
			},
			payload: JSON.stringify({
				grant_type: grantType,
				username: clientId,
			}),
		})
		.then(mapResult)
		.then(respond)
		.then((result) => {
			this.access_token = result.body.access_token;
			this.refresh_token = result.body.refresh_token;
		});
	}


}

module.exports = OAuth;
