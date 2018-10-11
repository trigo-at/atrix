'use strict';

/* eslint class-methods-use-this: 0, no-use-before-define: 0 */
class TestPluginOther {}

const register = (a) => {
	plugin.registerCall.atrix = a;
	plugin.atrix = a; // eslint-disable-line
};

const factory = (atrix, service, config) => {
	plugin.factoryCall.atrix = atrix;
	plugin.factoryCall.service = service;
	plugin.factoryCall.config = config;
	plugin.instance = new TestPluginOther();// eslint-disable-line
	return plugin.instance;// eslint-disable-line
};

const reset = () => {
	plugin.atrix = {};
	plugin.factoryCall = {};
	plugin.registerCall = {};
	plugin.instance = {};
};

const plugin = {
	name: 'test-plugin-other',
	version: '1.0.0',
	register,
	atrix: {},
	factory,
	factoryCall: {},
	registerCall: {},
	instance: {},
	reset,
};

module.exports = plugin;
