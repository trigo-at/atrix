'use strict';

const { clone, lensPath, set, omit, merge, pick, map } = require('ramda');

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
		let config = clone(rawConfig);
		getKeys(omit(['logger'], rawConfig)).forEach((path) => {
			const pathArray = map(p => (isNaN(parseInt(p, 10)) ? p : parseInt(p, 10)), path.split('.'));
			const lense = lensPath(pathArray);

			// prefix key path uppercase with ATRIX_<SERVICENAME>_...
			const envName = `ATRIX_${serviceName.toUpperCase()}_${path.split('.').join('_').toUpperCase()}`;
			if (env[envName] !== undefined) {
				config = set(lense, env[envName], config);
			}
		});

		this.config = merge(config, pick(['logger'], rawConfig));
	}
}

module.exports = Config;
