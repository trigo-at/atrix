'use strict';


function register(a) {
	plugin.atrix = a; // eslint-disable-line
}

const plugin = {
	name: 'test-plugin2-pd',
	version: '1.0.0',
	register,
	atrix: {},
};

module.exports = plugin;
