
const atrix = require('@trigo/atrix');
const path = require('path');

atrix.configure({ pluginSearchPaths: [path.join(__dirname, '../../')] });

const svc = new atrix.Service('mongoose', {
	dataSource: {
		m1: {
			type: 'mongoose',
			config: {
				modelFactory: path.join(__dirname, './models/factory'),
				connectionString: 'mongodb://localhost:27017/test-atrix-mongoose-m1',
			},
		},
		m2: {
			type: 'mongoose',
			config: {
				modelFactory: path.join(__dirname, './models/factory'),
				connectionString: 'mongodb://localhost:27017/test-atrix-mongoose-m2',
			},
		},
	},
});
atrix.addService(svc);

