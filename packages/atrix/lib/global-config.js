'use strict';

const cfg = {
	pluginMap: {},
	pluginSearchPaths: [],
};

module.exports = cfg;
module.exports.reset = () => {
	cfg.pluginMap = {};
	cfg.pluginSearchPaths = [];
};

