'use strict';

const atrix = require('@trigo/atrix');
const path = require('path');

atrix.configure({ pluginMap: { swagger: path.join(__dirname, '../') } });

const svc = new atrix.Service('s1', {
	swagger: {
		serivceDefinition: path.join(__dirname, './s1.yml'),
	},
});

atrix.addService(svc);
