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

function tryLoadFromPluginMap(atrix, name) {
	let plugin;
	let modulePath;

	if (!atrix.config.pluginMap[name]) {
		return null;
	}

	try {
		modulePath = atrix.config.pluginMap[name];
		const p = require(modulePath); // eslint-disable-line
		plugin = p;
	} catch (e) {
		// console.error(`Failed to load ${modulePath}`, e);
	} // eslint-disable-line

	if (plugin) {
		installPlugin(atrix, plugin);
		return plugin;
	}

	return null;
}

function tryLoadFromSearchPath(atrix, name) {
	let plugin;
	for (let i = 0; i < atrix.config.pluginSearchPaths.length && !plugin; i++) {
		let modulePath;
		try {
			modulePath = path.join(
				atrix.config.pluginSearchPaths[i],
				`atrix-${name}`
			);
			const p = require(modulePath); // eslint-disable-line
			plugin = p;
		} catch (e) {
			// console.error(`Failed to load ${modulePath}`, e);
		} // eslint-disable-line
	}

	if (plugin) {
		installPlugin(atrix, plugin);
		return plugin;
	}

	return null;
}

function loadFromNodeModules(atrix, name) {
	let plugin = require(`@trigo/atrix-${name}`); // eslint-disable-line
	installPlugin(atrix, plugin);
	return plugin;
}

function loadPlugin(atrix, name) {
	let plugin;

	plugin = tryLoadFromPluginMap(atrix, name);
	if (plugin) return plugin;

	plugin = tryLoadFromSearchPath(atrix, name);
	if (plugin) return plugin;

	return loadFromNodeModules(atrix, name);
}

module.exports = loadPlugin;
