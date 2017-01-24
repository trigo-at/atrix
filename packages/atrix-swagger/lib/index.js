'use strict';

const pkg = require('../package.json');
const AtrixSwagger = require('./AtrixSwagger');

module.exports = {
	name: pkg.name,
	version: pkg.version,
	register: () => {},
	factory: (atrix, service, config) => {
		return new AtrixSwagger(atrix, service, config);
	},
};
