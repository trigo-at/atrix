module.exports = {
	service: {
	},
	endpoints: {
		http: {
			port: 3000,
			prefix: '/accounting'
		}
	},
	upstream: {
		reporting: {
			url: 'http://localhost:3001'
		}
	}
};
