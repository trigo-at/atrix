'use strict';

const R = require('ramda');

class Config {
	constructor(serviceName, rawConfig) {
		const envs = process.env;
		const serviceEnvKeys = Object.keys(envs).filter(x => x.toLowerCase().startsWith(`atrix_${serviceName}_`));
		this.config = R.clone(rawConfig);
		for (const i in serviceEnvKeys) {
			const value = envs[serviceEnvKeys[i]];
			const key = serviceEnvKeys[i].toLowerCase().replace(`atrix_${serviceName}_`, '');

			const parts = key.split('_');
			let currentPart = this.config;
			for (const j in parts) {
				const part = Config.getPartNotation(currentPart, parts[j]);
				if (j == (parts.length - 1)) {
					currentPart[part] = value;
				}				else {
					currentPart[part] = currentPart[part] || {};
					currentPart = currentPart[part];
				}
			}
		}
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
