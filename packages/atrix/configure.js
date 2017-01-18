'use strict';

let atrixConfig;

module.exports = (configObj) => {
	atrixConfig = configObj;
	return (cfg) => {
		console.log('Merge config', cfg, ' into', atrixConfig);
		Object.keys(cfg).forEach(key => {
			atrixConfig[key] = cfg[key];
		});
	};
};

