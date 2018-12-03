module.exports = {
	name: 'upstreamoptions',
	endpoints: {
		http: {
			port: 3006,
		},
	},
	upstream: {
		options: {
			url: 'http://some.url',
			options: {
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'ATRIX_UPSTREAM',
				},
			},
		},
	},
};
