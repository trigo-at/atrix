module.exports = {
	endpoints: {
		http: {
			port: 3008,
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
