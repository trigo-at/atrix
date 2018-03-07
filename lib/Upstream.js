'use strict';

const bb = require('bluebird');
const retry = require('bluebird-retry');
const fetchLib = require('fetch');
const Basic = require('./upstreamAuth/Basic');
const OAuth = require('./upstreamAuth/OAuth');
const R = require('ramda');
const mapResult = require('./map-result');
const respond = require('./respond');

const fetch = bb.promisify(fetchLib.fetchUrl, { multiArgs: true });

class Upstream {
	constructor(name, config) {
		this.name = name;
		this.config = config;

		// all requests will automatically retry max_tries
		// usage of upstream.retry not necessary
		if (this.config.retry && this.config.retry.auto) {
			this._retry = {
				max_tries: this.config.retry.max_tries,
				interval: this.config.retry.interval,
			};
		}

		if (this.config.security && this.config.security.strategies) {
			const { strategies } = this.config.security;
			if (strategies.oauth) {
				this.auth = new OAuth(strategies.oauth);
			}

			if (strategies.basic) {
				this.auth = new Basic(strategies.basic);
			}
		}
	}

	get(path, { queryParams, payload, options } = {}) {
		return this.fetchByMethod('GET', path, queryParams, payload, options);
	}

	post(path, { queryParams, payload, options } = {}) {
		return this.fetchByMethod('POST', path, queryParams, payload, options);
	}

	put(path, { queryParams, payload, options } = {}) {
		return this.fetchByMethod('PUT', path, queryParams, payload, options);
	}

	delete(path, { queryParams, payload, options } = {}) {
		return this.fetchByMethod('DELETE', path, queryParams, payload, options);
	}

	patch(path, { queryParams, payload, options } = {}) {
		return this.fetchByMethod('PATCH', path, queryParams, payload, options);
	}

	buildOptions(options, overrideOptions) {
		const combinedOptions = Object.assign({}, this.config.options, options);
		let authorize;
		if (!this.auth) {
			authorize = Promise.resolve(combinedOptions);
		}
		if (this.auth) {
			authorize = this.auth.authorize.bind(this.auth)(combinedOptions);
		}
		return new Promise((resolve, reject) => {
			authorize.then((fetchOptions) => {
				const fo = R.clone(fetchOptions);
				if (typeof fetchOptions.payload === 'object') {
					fo.payload = JSON.stringify(fetchOptions.payload);
				}

				if (overrideOptions) {
					Object.keys(overrideOptions).forEach((key) => {
						if (['method', 'payload', 'headers'].indexOf(key.toLowerCase()) !== -1) {
							fo[key] = overrideOptions[key];
						}
					});
				}
				resolve(fo);
			})
				.catch(err => reject(err));
		});
	}

	getUri(path, queryParams) {
		return `${this.config.url}${path}${Upstream.buildQueryString(queryParams)}`;
	}

	static buildQueryString(queryParams) {
		if (queryParams && Object.keys(queryParams).length) {
			const queryString = Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`).join('&');
			return `?${queryString}`;
		}
		return '';
	}

	fetchByMethod(method, path, queryParams, payload, options) {
		return this.buildOptions({
			method,
			payload,
		}, options)
			.then((fetchOptions) => {
				if (this._retry) {
					return retry(() => fetch(this.getUri(path, queryParams), fetchOptions)
						.then(mapResult)
						.then(respond), this._retry);
				}
				return fetch(this.getUri(path, queryParams), fetchOptions)
					.then(Upstream.mapResult)
					.then(Upstream.respond);
			});
	}

	get retry() {
		return new Upstream(this.name, Object.assign({}, this.config, {
			_retry: {
				max_tries: this.config.retry.max_tries,
				interval: this.config.retry.interval,
			},
		}));
	}

	static mapResult(result) {
		const [response, responseBody] = result;
		let body = responseBody;
		if (response.responseHeaders['content-type'] !== 'application/octet-stream') {
			try {
				if (response.status !== 204) {
					body = JSON.parse(responseBody.toString());
				}
			} catch (err) {
				body = responseBody.toString();
			}
		}
		return {
			status: response.status,
			headers: response.responseHeaders,
			body,
		};
	}

	static respond(response) {
		if (response.status < 200 || response.status >= 300) {
			throw response;
		} else {
			return response;
		}
	}
}

module.exports = Upstream;
