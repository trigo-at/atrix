const bb = require('bluebird');
const fetchLib = require('fetch');
const btoa = require('btoa');
const fetch = bb.promisify(fetchLib.fetchUrl, { multiArgs: true });

class OAuth {
	constructor(config) {
		this.config = config;
	}

	authorize(fetchOptions) {
		return new Promise((resolve, reject) => {
			if (!this.access_token) {
				this.getToken()
				.then(() => {
					fetchOptions.headers.Authorization = `Bearer ${this.access_token}`;
					resolve(fetchOptions);
				})
				.catch(err => reject(err));
			} else {
				fetchOptions.headers.Authorization = `Bearer ${this.access_token}`;
				resolve(fetchOptions);
			}
		});
	}

	getToken() {
		const { auth_endpoint, client_id, client_secret, grant_type } = this.config;
		return fetch(auth_endpoint, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${btoa(`${client_id}:${client_secret}`)}`,
				'Content-Type': 'application/json',
			},
			payload: JSON.stringify({
				grant_type,
				username: client_id,
			}),
		})
		.then(this.mapResult)
		.then(this.respond)
		.then(result => {
			this.access_token = result.body.access_token;
			this.refresh_token = result.body.refresh_token;
		});
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
			headers: response.responseHeaders,
			body,
		};
	}

	respond(response) {
		if (response.status < 200 || response.status >= 300) {
			throw response;
		} else {
			return response;
		}
	}
}

module.exports = OAuth;
