'use strict';

const bb = require('bluebird');
const fetchLib = require('fetch');
const Basic = require('./upstreamAuth/Basic');
const OAuth = require('./upstreamAuth/OAuth');
const R = require('ramda');
const Boom = require('boom');

const fetch = bb.promisify(fetchLib.fetchUrl, { multiArgs: true });

class Upstream {
	constructor(name, config, logger) {
		this.name = name;
		this.config = config;
		this.log = logger;

		// all requests will automatically retry max_tries
		// usage of upstream.retry not necessary
		if (this.config.retry) {
			this._retry = {
				max_tries: this.config.retry.max_tries,
				interval: this.config.retry.interval || 500,
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

	async buildOptions(options, overrideOptions) {
		const combinedOptions = Object.assign({}, this.config.options, options);
		let fetchOptions;
		if (this.auth) {
			fetchOptions = await this.auth.authorize.bind(this.auth)(combinedOptions);
		} else {
			fetchOptions = combinedOptions;
		}

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
		return fo;
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

	async fetchByMethod(method, path, queryParams, payload, options) {
		const fetchOptions = await this.buildOptions({
			method,
			payload,
		}, options);

		let tries = 0;
		let lastError;
		do {
			try {
				const fetchResult = await fetch(this.getUri(path, queryParams), fetchOptions);
				const mappedResult = await this.mapResult(fetchResult);
				return this.respond(mappedResult);
			} catch (e) {
				lastError = e;
				tries++;
				if (this._retry && this._retry.interval) {
					await bb.delay(this._retry.interval);
				}
			}
		} while (this._retry && this._retry.max_tries > tries);

		throw lastError;
	}

	get retry() {
		return new Upstream(this.name, Object.assign({}, this.config, {
			_retry: {
				max_tries: this.config.retry.max_tries,
				interval: this.config.retry.interval,
			},
		}));
	}

	mapResult(result) {
		const [response, responseBody] = result;
		let body = responseBody;
		if (response.status < 500 || response.status >= 400) {
			this.log.warn(response);
		} else if (response.status >= 500) {
			this.log.error(response);
		}

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

	// eslint-disable-next-line
	respond(response) {
		if (response.status < 200 || response.status >= 500) {
			throw Boom.create(response.status, 'Upstream response error', response);
		} else {
			return response;
		}
	}
}

module.exports = Upstream;
