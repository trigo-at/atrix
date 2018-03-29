'use strict';

const EndpointsList = require('./EndpointsList');
const ServiceEventEmitter = require('./ServiceEventEmitter');
const Logger = require('./Logger');
const HandlerList = require('./HandlerList');
const UpstreamList = require('./UpstreamList');
const DataSourceList = require('./DataSourceList');
const Config = require('./Config');
const {merge, pick, omit, defaultTo} = require('ramda');
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

		this.config.config.logger = defaultTo({}, this.config.config.logger);

		const logConf = merge(
			{
				name: this.name,
			},
			pick(['level', 'name'], this.config.config.logger)
		);
		this.log = Logger.createLogger(logConf);
		if (this.log.addStream && this.config.config.logger.streams) {
			this.config.config.logger.streams.forEach(s => {
				const streamCfg = merge(
					{level: this.config.config.logger.level},
					s
				);
				this.log.addStream(streamCfg);
			});
		}

		this.endpoints = new EndpointsList(this, this.config.config.endpoints);
		this.events = new ServiceEventEmitter();
		this.handlers = new HandlerList(this.endpoints);
		this.upstream = new UpstreamList(this.config.config.upstream);
		this.dataSourcesList = new DataSourceList(
			this,
			this.config.config.dataSource
		);
		this.settings = this.config.config.settings || {};
		this.plugins = {};

		// console.log(this.endpoints);

		this.events.on('starting', () => {
			this.log.info(`Starting service... ${this.name}`);

			this.log.debug(
				`Config: ${JSON.stringify(
					omit(['logger'], this.config.config),
					null,
					2
				)}`
			);
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
		const ignoreList = [
			'dataSource',
			'endpoints',
			'upstream',
			'service',
			'security',
			'settings',
			'logger',
		];
		const tasks = [];
		Object.keys(this.config.config).forEach(async key => {
			if (ignoreList.indexOf(key) !== -1) {
				return;
			}
			const plugin = loadPlugin(this.atrix, key);
			const instance = plugin.factory(
				this.atrix,
				this,
				this.config.config[key]
			);
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
		await this.dataSourcesList.start();

		this.handlers.add('GET', '/alive', (req, reply) =>
			reply({status: 200, description: 'OK'})
		);

		return this.endpoints
			.start()
			.then(() => {
				this.events.emit('started');
			})
			.catch(err => {
				this.log.error(err);
				throw err;
			});
	}

	stop() {
		this.events.emit('stopping');
		return this.endpoints
			.stop()
			.then(() => {
				this.events.emit('stopped');
			})
			.catch(err => {
				this.log.error(err);
				throw err;
			});
	}
}

module.exports = Service;
