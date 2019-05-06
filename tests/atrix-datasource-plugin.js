'use strict';

/* eslint class-methods-use-this: 0, no-use-before-define: 0 */

const bb = require('bluebird');

class DataSourcePlugin {
    async start() {
        await bb.delay(10);
        plugin.instance.started = true; // eslint-disable-line
        return {
            db: {},
        };
    }
}

const register = a => {
    plugin.registerCall.atrix = a;
    plugin.atrix = a; // eslint-disable-line
};

const factory = (atrix, service, config) => {
    plugin.factoryCall.atrix = atrix;
    plugin.factoryCall.service = service;
    plugin.factoryCall.config = config;
    plugin.instance = new DataSourcePlugin(); // eslint-disable-line
    return plugin.instance; // eslint-disable-line
};

const reset = () => {
    plugin.atrix = {};
    plugin.factoryCall = {};
    plugin.registerCall = {};
    plugin.instance = {};
};

const plugin = {
    name: 'datasource-plugin',
    version: '1.0.0',
    register,
    atrix: {},
    compatibility: {
        atrix: {
            min: '6.0.0-7',
        },
    },
    factory,
    factoryCall: {},
    registerCall: {},
    instance: {},
    reset,
};

module.exports = plugin;
