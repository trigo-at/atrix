
const pkg = require('../package.json');

const AtrixMongoose = require('./AtrixMongoose');

module.exports = {
	name: pkg.name,
	version: pkg.version,
	register: (atrix) => {},
	factory: (atrix, service, config) => {
		return new AtrixMongoose(atrix, service, config);
	},
};
