module.exports = {
	name: 'brokenupstream',
	endpoints: {
		http: {
			port: 3002,
		},
	},
	upstream: {
		broken: {
			url: 'http://localhost:4444',
		},
	},
};
