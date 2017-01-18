'use strict';

const path = require('path');

function installPlugin(atrix, plugin) {
	if (!plugin.name || typeof plugin.name !== 'string') {
		throw new Error('Required property "name" missing');
	}
	if (!plugin.version || typeof plugin.version !== 'string') {
		throw new Error('Required property "version" missing');
	}
	if (!plugin.register || typeof plugin.register !== 'function') {
		throw new Error('Required function "register" missing');
	}

	plugin.register(atrix);
}

function loadPlugin(atrix, name) {
	let plugin;
	console.log(atrix.config.pluginSearchPaths)
	for (let i = 0; i < atrix.config.pluginSearchPaths.length && !plugin; i++) {
		let modulePath;
		try {
			modulePath = path.join(atrix.config.pluginSearchPaths[i], `atrix-${name}`);
			console.log(modulePath);
			const p = require(modulePath); // eslint-disable-line
			plugin = p;
		} catch (e) {
			console.error(`Failed to load ${modulePath}`, e);
		} // eslint-disable-line
	}

	if (plugin) {
		installPlugin(atrix, plugin);
		return plugin;
	}

	plugin = require(`@trigo/atrix-${name}`); // eslint-disable-line
	installPlugin(atrix, plugin);
	return plugin;
}

module.exports = loadPlugin;
