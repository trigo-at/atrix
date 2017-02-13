module.exports = {
	endpoints: {
		http: {
			port: 3008,
			cors: true,
		},
	},
	security: {
		strategies: {
			jwt: {
				secret: 'changeme',
				algorithm: 'HS256',
			},
		},
		endpoints: [
			'/data.*',
		],
	},
};
