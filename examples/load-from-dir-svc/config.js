'use strict';

module.exports = {
	endpoints: {
		http: {
			port: 3007,
			handlerDir: `${__dirname}/handlers`,
			cors: true,
			requestLogger: {
				enabled: false,
				logFullRequest: true,
				logFullResponse: true,
			},
		},
	},
};
