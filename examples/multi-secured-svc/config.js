'use strict';

module.exports = {
	endpoints: {
		http: {
			port: 3018,
			cors: true,
		},
	},
	security: {
		strategies: {
			jwt: {
				secret: 'changeme',
				algorithm: 'HS256',
			},
			signedlink: {
				secret: 'test-secret',
			},
		},
		endpoints: {
			jwt: ['/jwt.*'],
			signedlink: ['/signedlink.*'],
		},
	},
};
