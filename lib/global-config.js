'use strict';

module.exports = () => {
	const cfg = {
		pluginMap: {},
		pluginSearchPaths: [],
	};

	cfg.reset = () => {
		cfg.pluginMap = {};
		cfg.pluginSearchPaths = [];
	};

	return cfg;
};
