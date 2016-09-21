module.exports = {
	endpoints: {
		http: {
			port: 3001
		}
	},
	security: {
		strategies: {
			jwt: {
				secret: 'changeme',
				algorithm: 'HS256',
			}
		},
		endpoints: [
			'/data.*'
		]
	}
};
