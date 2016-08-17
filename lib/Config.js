'use strict';

class Config {
	constructor(serviceName, rawConfig) {
		var envs = process.env;
		var serviceEnvKeys = Object.keys(envs).filter(x => x.toLowerCase().startsWith(`atrix_${serviceName}_`));
		this.config = JSON.parse(JSON.stringify(rawConfig));
		for (let i in serviceEnvKeys) {
			let value = envs[serviceEnvKeys[i]];
			let key = serviceEnvKeys[i].toLowerCase().replace(`atrix_${serviceName}_`, '');

			let parts = key.split('_');
			let currentPart = this.config;
			for (let j in parts) {
				let part = parts[j];
				if (j == (parts.length - 1)) {
					currentPart[part] = value;
				}
				else {
					currentPart[part] = currentPart[part] || {};
					currentPart = currentPart[part];
				}
			}
		}
	}
}

module.exports = Config;
