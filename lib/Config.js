'use strict';

const R = require('ramda');

function getKeys(obj, prefix) {
	const keys = Object.keys(obj);
	prefix = prefix ? `${prefix}.` : ''; // eslint-disable-line no-param-reassign
	return keys.reduce((result, key) => {
		if (typeof obj[key] === 'object') {
			result = result.concat(getKeys(obj[key], `${prefix}${key}`)); // eslint-disable-line no-param-reassign
		} else {
			result.push(prefix + key);
		}
		return result;
	}, []);
}

class Config {
	constructor(serviceName, rawConfig, environment) {
		const env = environment || process.env;
		let config = R.clone(rawConfig);
		getKeys(rawConfig).forEach(path => {
			const lense = R.lensPath(path.split('.'));

			// prefix key path uppercase with ATRIX_<SERVICENAME>_...
			const envName = `ATRIX_${serviceName.toUpperCase()}_${path
				.split('.')
				.join('_')
				.toUpperCase()}`;
			if (env[envName] !== undefined) {
				config = R.set(lense, env[envName], config);
			}
		});

		this.config = config;
	}
}

module.exports = Config;
