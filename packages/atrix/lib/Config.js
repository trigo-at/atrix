'use strict';

const R = require('ramda');

class Config {
	constructor(serviceName, rawConfig) {
		const envs = process.env;
		const serviceEnvKeys = Object.keys(envs).filter(x => x.toLowerCase().startsWith(`atrix_${serviceName}_`));
		this.config = R.clone(rawConfig);
		Object.keys(serviceEnvKeys).forEach((key) => {
			const value = envs[serviceEnvKeys[key]];
			const thisKey = serviceEnvKeys[key].toLowerCase().replace(`atrix_${serviceName}_`, '');

			const parts = thisKey.split('_');
			let currentPart = this.config;

			Object.keys(parts).forEach((partKey) => {
				const part = Config.getPartNotation(currentPart, parts[partKey]);
				if (partKey === (parts.length - 1)) {
					currentPart[part] = value;
				}				else {
					currentPart[part] = currentPart[part] || {};
					currentPart = currentPart[part];
				}
			});
		});
	}

	static getPartNotation(currentPart, part) {
		let partName = part;
		Object.keys(currentPart).forEach((key) => {
			if (key.toLowerCase() === part && key !== part) {
				partName = key;
			}
		});
		return partName;
	}
}

module.exports = Config;
