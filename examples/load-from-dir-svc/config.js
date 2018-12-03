'use strict';

module.exports = {
	name: 'loadFromDir',
	endpoints: {
		http: {
			port: 3007,
			handlerDir: `${__dirname}/handlers`,
		},
	},
};
