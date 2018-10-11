'use strict';

const EndpointsList = require('./EndpointsList');
const ServiceEventEmitter = require('./ServiceEventEmitter');
const Logger = require('./Logger');
const HandlerList = require('./HandlerList');
const UpstreamList = require('./UpstreamList');
const DataSourceList = require('./DataSourceList');
const Config = require('./Config');
const { merge, pick, defaultTo } = require('ramda');
const loadPlugin = require('./load-plugin');

class Service {
	constructor(name, config) {
		this.name = name;
		this.config = new Config(this.name, config);

		this.printServiceDescription();
		this.connectSignalHandlers();
		this.log = this.createServiceLogger();

		this.endpoints = new EndpointsList(this, this.config.config.endpoints);
		this.events = new ServiceEventEmitter();
		this.handlers = new HandlerList(this.endpoints);
		this.upstream = new UpstreamList(this.config.config.upstream, this.log);
		this.dataSourcesList = new DataSourceList(this, this.config.config.dataSource);
		this.settings = this.config.config.settings || {};
		this.pluginModules = [];
		this.plugins = {};

		this.events.on('starting', () => {
			this.log.info(`Starting service... ${this.name}`);
		});

		this.events.on('started', () => {
			this.log.info('Started.');
		});

		this.events.on('stopped', () => {
			this.log.info('Stopped.');
		});
	}

	createServiceLogger() {
		this.config.config.logger = defaultTo({}, this.config.config.logger);

		const logConf = merge({
			name: this.name,
		}, pick(['level', 'name'], this.config.config.logger));

		const rootLogger = Logger.createLogger(logConf).child();
		if (rootLogger.addStream && this.config.config.logger.streams) {
			this.config.config.logger.streams.forEach((s) => {
				const streamCfg = merge({ level: this.config.config.logger.level }, s);
				rootLogger.addStream(streamCfg);
			});
		}

		return rootLogger.child({ component: 'Atrix' });
	}

	printServiceDescription() {
		// eslint-disable-next-line
		console.log(`
Initialize service: "${this.name}"

Environment:`);
		this.config.serviceConfig().forEach((s) => {
			const value = `"${(s.value || 'n/a')}"`;
			// eslint-disable-next-line
			console.log(`    ${s.key.padEnd(70, ' ')} ${value.padEnd(40, ' ')} [default: "${s.defaultValue}"]`);
		});
		// eslint-disable-next-line
		console.log('');
	}

	connectSignalHandlers() {
		process.on('SIGINT', async () => {
			await this.stop();
		});

		process.on('SIGTERM', async () => {
			await this.stop();
		});
	}

	setAtrix(atrix) {
		this.atrix = atrix;
		this.dataSourcesList.setAtrix(atrix);

		// load-all-top-level-plugins
		this.loadPluginModulesFromConfigSections();
	}

	loadPluginModulesFromConfigSections() {
		const ignoreList = ['dataSource', 'endpoints', 'upstream', 'service', 'security', 'settings', 'logger'];
		// eslint-disable-next-line
		Object.keys(this.config.config).forEach(async (configKey) => {
			if (ignoreList.indexOf(configKey) !== -1) {
				return;
			}
			const plugin = loadPlugin(this.atrix, configKey, this);
			this.pluginModules.push({
				plugin,
				configKey,
			});
		});
	}

	async initializePlugins() {
		const tasks = [];
		// eslint-disable-next-line
		this.log.info('Initialize plugins...');
		this.pluginModules.forEach((p) => {
			const instance = p.plugin.factory(this.atrix, this, this.config.config[p.configKey]);
			this.log.info(`initialized plugin: ${p.plugin.name} ${p.plugin.version}`);
			if (typeof instance.start === 'function') {
				tasks.push(instance.start());
			}
			this.plugins[p.configKey] = instance;
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

		await this.initializePlugins();
		await this.dataSourcesList.start();

		this.handlers.add('GET', '/alive', (req, reply) => { //eslint-disable-line
			return reply({ status: 200, description: 'OK' });
		});

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
