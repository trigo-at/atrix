module.exports = {
	name: 'test',
	endpoints: {
		http: {
			port: 3333,
			handlerDir: `${__dirname}/handlers`,
		},
	},
};
