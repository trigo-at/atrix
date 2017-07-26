module.exports = {
	endpoints: {
		http: {
			port: 3005,
		},
	},
	upstream: {
		basicAuth: {
			url: 'http://basic.secured.url',
			security: {
				strategies: {
					basic: {
						username: 'username',
						password: 'password',
					},
				},
			},
		},
		oAuth: {
			url: 'http://oauth-token.secured.url',
			security: {
				strategies: {
					oauth: {
						client_id: 'client_id',
						client_secret: 'client_secret',
						auth_endpoint: 'http://auth.endpoint/token',
						grant_type: 'password',
					},
				},
			},
		},
	},
};
