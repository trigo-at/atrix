'use strict';

const path = require('path');
const {version} = require('../package.json');
const cv = require('compare-versions');

function installPlugin(atrix, plugin, service) {
    if (!plugin.name || typeof plugin.name !== 'string') {
        throw new Error('Required property "name" missing');
    }
    if (!plugin.version || typeof plugin.version !== 'string') {
        throw new Error('Required property "version" missing');
    }
    if (!plugin.register || typeof plugin.register !== 'function') {
        throw new Error('Required function "register" missing');
    }
    if (!plugin.compatibility) {
        throw new Error('Required property "compatibility" missing');
    }
    if (!plugin.compatibility.atrix) {
        throw new Error('Required property "compatibility.atrix" missing');
    }
    if (!plugin.compatibility.atrix.min || typeof plugin.compatibility.atrix.min !== 'string') {
        throw new Error('Required property "compatibility.atrix.min" missing');
    }

    if (cv(version, plugin.compatibility.atrix.min) === -1) {
        throw new Error(
            `Plugin "${plugin.name}@${plugin.version}" requires atrix >= "${plugin.compatibility.atrix.min}"`
        );
    }
    if (plugin.compatibility.atrix.max) {
        if (cv(plugin.compatibility.atrix.max, version) === -1) {
            throw new Error(
                `Plugin "${plugin.name}@${plugin.version}" requires atrix <= "${plugin.compatibility.atrix.max}"`
            );
        }
    }

    plugin.register(atrix);
    service.log.info(`loaded plugin: ${plugin.name} ${plugin.version}`);
}

function tryLoadFromPluginMap(atrix, name, service) {
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
        installPlugin(atrix, plugin, service);
        return plugin;
    }

    return null;
}

function tryLoadFromSearchPath(atrix, name, service) {
    let plugin;
    for (let i = 0; i < atrix.config.pluginSearchPaths.length && !plugin; i++) {
        let modulePath;
        try {
            modulePath = path.join(atrix.config.pluginSearchPaths[i], `atrix-${name}`);
            const p = require(modulePath); // eslint-disable-line
            plugin = p;
        } catch (e) {
            // console.error(`Failed to load ${modulePath}`, e);
        } // eslint-disable-line
    }

    if (plugin) {
        installPlugin(atrix, plugin, service);
        return plugin;
    }

    return null;
}

function loadFromNodeModules(atrix, name, service) {
    let plugin = require(`@trigo/atrix-${name}`); // eslint-disable-line
    installPlugin(atrix, plugin, service);
    return plugin;
}

function loadPlugin(atrix, name, service) {
    let plugin;

    plugin = tryLoadFromPluginMap(atrix, name, service);
    if (plugin) return plugin;

    plugin = tryLoadFromSearchPath(atrix, name, service);
    if (plugin) return plugin;

    return loadFromNodeModules(atrix, name, service);
}

module.exports = loadPlugin;
