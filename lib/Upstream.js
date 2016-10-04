const bb = require('bluebird');
const retry = require('bluebird-retry');
const fetchLib = require('fetch');
const btoa = require('btoa');

const fetch = bb.promisify(fetchLib.fetchUrl, { multiArgs: true });

class Upstream {
	constructor(name, config) {
		this.name = name;
		this.config = config;

		//all requests will automatically retry max_tries
		//usage of upstream.retry not necessary
		if (this.config.retry && this.config.retry.auto) {
			this.config._retry = {
				max_tries: this.config.retry.max_tries,
				interval: this.config.retry.interval,
			};
		}
	}

	get(path, { queryParams, payload, options }) {
		return this.fetchByMethod('GET', path, queryParams, payload, options);
	}

	post(path, { queryParams, payload, options }) {
		return this.fetchByMethod('POST', path, queryParams, payload, options);
	}

	put(path, { queryParams, payload, options }) {
		return this.fetchByMethod('PUT', path, queryParams, payload, options);
	}

	delete(path, { queryParams, payload, options }) {
		return this.fetchByMethod('DELETE', path, queryParams, payload, options);
	}

	respond(response) {
		if (response.status < 200 || response.status >= 300) {
			throw response;
		} else {
			return response;
		}
	}

	buildOptions(options, overrideOptions) {
		const fetchOptions = Object.assign({}, this.config.options, options);
		if (this.config.authorization === 'Basic') {
			fetchOptions.headers = fetchOptions.headers || {};
			fetchOptions.headers.Authorization = `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`;
		}
		if (typeof fetchOptions.payload === 'object') {
			fetchOptions.payload = JSON.stringify(fetchOptions.payload)
		}
		if (overrideOptions) {
			Object.keys(overrideOptions).forEach(key => {
				if (key.toLowerCase() === 'method' || key.toLowerCase() === 'payload') {
					fetchOptions[key] = overrideOptions[key];
				}
			});
		}
		return fetchOptions;
	}

	getUri(path, queryParams) {
		return `${this.config.url}${path}${this.buildQueryString(queryParams)}`;
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

	fetchByMethod(method, path, queryParams, payload, options) {
		if (this.config._retry) {
			return retry(() => {
				return fetch(this.getUri(path, queryParams), this.buildOptions({
					method,
					payload,
				}, options))
				.then(this.mapResult)
				.then(this.respond);
			}, this.config._retry);
		}
		return fetch(this.getUri(path, queryParams), this.buildOptions({
			method,
			payload,
		}, options))
		.then(this.mapResult)
		.then(this.respond);
	}

	get retry() {
		return new Upstream(this.name, Object.assign({}, this.config, {
			_retry: {
				max_tries: this.config.retry.max_tries,
				interval: this.config.retry.interval,
			},
		}));
	}

	get fetch() {
		return fetch;
	}
}

module.exports = Upstream;
