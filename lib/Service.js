'use strict';

const EndpointsList = require('./EndpointsList');
const ServiceEventEmitter = require('./ServiceEventEmitter');
const Logger = require('./Logger');
const HandlerList = require('./HandlerList');
const UpstreamList = require('./UpstreamList');
const DataSourceList = require('./DataSourceList');
const Config = require('./Config');
const R = require('ramda');
const loadPlugin = require('./load-plugin');

class Service {
	constructor(name, config) {
		this.name = name;
		this.config = new Config(this.name, config);

		process.on('SIGINT', async () => {
			await this.stop();
		});

		process.on('SIGTERM', async () => {
			await this.stop();
		});

		const logConf = R.clone(this.config.config.logger || {});
		logConf.name = this.name;
		this.log = Logger.createLogger(logConf);
		this.endpoints = new EndpointsList(this, this.config.config.endpoints);
		this.events = new ServiceEventEmitter();
		this.handlers = new HandlerList(this.endpoints);
		this.upstream = new UpstreamList(this.config.config.upstream);
		this.dataSourcesList = new DataSourceList(this, this.config.config.dataSource);
		this.settings = this.config.config.settings || {};
		this.plugins = {};

		// console.log(this.endpoints);

		this.events.on('starting', () => {
			this.log.info(`Starting service... ${this.name}`);
			this.log.debug(`Config: ${JSON.stringify(this.config, null, 2)}`);
		});

		this.events.on('started', () => {
			this.log.info('Started.');
		});

		this.events.on('stopped', () => {
			this.log.info('Stopped.');
		});
	}

	setAtrix(atrix) {
		this.atrix = atrix;
		this.dataSourcesList.setAtrix(atrix);
	}

	async loadPluginsFromConfigSections() {
		console.log('LOAD PLUGINS')
		const ignoreList = ['dataSource', 'endpoints', 'upstream', 'service', 'security', 'settings'];
		const tasks = [];
		Object.keys(this.config.config).forEach(async (key) => {
			if (ignoreList.indexOf(key) !== -1) {
				return;
			}
			const plugin = loadPlugin(this.atrix, key);
			const instance = plugin.factory(this.atrix, this, this.config.config[key]);
			console.log(instance);
			if (typeof instance.start === 'function') {
				tasks.push(instance.start());
			}
			this.plugins[key] = instance;
		});
		await Promise.all(tasks);
	}

	get dataSources() {
		return this.dataSourcesList.dataSources;
	}

	get dataConnections() {
		return this.dataSourcesList.connections;
	}

	async start() {
		this.events.emit('starting');

		await this.loadPluginsFromConfigSections();
		console.log('satrt datasoursec')
		await this.dataSourcesList.start();

		console.log('register alive')
		this.handlers.add('GET', '/alive', (req, reply) => { //eslint-disable-line
			return reply({ status: 200, description: 'OK' });
		});

		console.log('start endpoints')
		return this.endpoints.start().then(() => {
			this.events.emit('started');
		}).catch((err) => {
			this.log.error(err);
			throw err;
		});
	}

	stop() {
		this.events.emit('stopping');
		return this.endpoints.stop().then(() => {
			this.events.emit('stopped');
		}).catch((err) => {
			this.log.error(err);
			throw err;
		});
	}
}

module.exports = Service;
