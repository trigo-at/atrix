'use strict';

const bb = require('bluebird');

const Basic = require('./upstreamAuth/Basic');
const OAuth = require('./upstreamAuth/OAuth');
const R = require('ramda');
const Boom = require('boom');

const fetch = require('axios');

class Upstream {
	constructor(name, config, logger) {
		this.name = name;
		this.config = R.clone(config);
		this.log = logger;

		if (this.config.retry) {
			if (this.config.retry.max_tries) {
				this.log.warn('DEPRECATED upstream property "retry.max_tries", use "retry.maxTries" instead');
			}
			this.retrySettings = {
				maxTries: this.config.retry.max_tries || this.config.retry.maxTries,
				interval: this.config.retry.interval || 500,
			};
		}

		if (this.config.security && this.config.security.strategies) {
			const { strategies } = this.config.security;
			if (strategies.oauth) {
				this.authStrategy = new OAuth(strategies.oauth);
			}

			// TODO: use axios basic auth instead of own implementation
			if (strategies.basic) {
				this.authStrategy = new Basic(strategies.basic);
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

	head(path, { queryParams, payload, options } = {}) {
		return this.fetchByMethod('HEAD', path, queryParams, payload, options);
	}

	options(path, { queryParams, payload, options } = {}) {
		return this.fetchByMethod('OPTIONS', path, queryParams, payload, options);
	}

	async buildOptions(options, overrideOptions) {
		const combinedOptions = Object.assign({}, this.config.options, options);
		let fetchOptions;
		if (this.authStrategy) {
			fetchOptions = await this.authStrategy.authorize.bind(this.authStrategy)(combinedOptions);
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

	async fetchByMethod(method, path, queryParams, data, options) {
		const fetchOptions = await this.buildOptions({
			method,
			url: this.getUri(path, queryParams),
			data,
			validateStatus: () => true, // axios must NOT throw any errors for apparently failed requests,
		}, options);


		let tries = 0;
		let lastError;
		do {
			try {
				const fetchResult = await fetch(fetchOptions);
				const mappedResult = await this.mapResult(fetchResult);
				return Upstream.respond(mappedResult);
			} catch (e) {
				lastError = e;
				tries++;
				if (this.retrySettings && this.retrySettings.interval) {
					await bb.delay(this.retrySettings.interval);
				}
			}
		} while (this.retrySettings && this.retrySettings.maxTries > tries);

		throw lastError;
	}

	mapResult(result) {
		const { status, headers, data, statusText } = result;
		if (status < 500 && status >= 400) {
			this.log.warn(result);
		} else if (status >= 500) {
			this.log.error(result);
		}

		// result.data parsing not necessary, axios does that for us

		return {
			status,
			statusCode: status, // compatibility layer
			statusText,
			headers,
			body: data,
			result: data, // compatibility layer
		};
	}

	static respond(response) {
		if (response.status < 200 || response.status >= 500) {
			throw Boom.create(response.status, 'Upstream response error', response);
		} else {
			return response;
		}
	}
}

module.exports = Upstream;
