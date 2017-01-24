'use strict';

const pkg = require('../package.json');

module.exports = {
	name: pkg.name,
	version: pkg.version,
	register: () => {},
	loadOnStart: pkg.config.loadOnStart,
	// factory: (atrix, service, config) => {
		// return new AtrixMongoose(atrix, service, config);
	// },
};
