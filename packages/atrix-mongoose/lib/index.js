
const pkg = require('../package.json');

const connect = require('./connect');

class AtrixMongoose {
	constructor(atrix, config) {
		this.atrix = atrix;
		this.config = config;
	}

	async start() {
		console.log('start connection', this.config)
		return await connect(this.config);
	}
}


module.exports = {
	name: pkg.name,
	version: pkg.version,
	register: (atrix) => {},
	factory: (atrix, config) => {
		return new AtrixMongoose(atrix, config);
	}
};
