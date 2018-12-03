module.exports = {
	name: 'downstream',
	service: {
	},
	endpoints: {
		http: {
			port: 3000,
		},
	},
	upstream: {
		reporting: {
			url: 'http://localhost:3001',
		},
	},
};
