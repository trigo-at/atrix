'use strict';

const EndpointsList = require('./EndpointsList');
const ServiceEventEmitter = require('./ServiceEventEmitter');
const Logger = require('./Logger');
const HandlerList = require('./HandlerList');
const UpstreamList = require('./UpstreamList');
const DataSourceList = require('./DataSourceList');
const Config = require('./Config');
const R = require('ramda');

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

		this.events.on('starting', () => {
			this.log.info(`Settings: ${this.config}` || {});
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

	get dataSources() {
		return this.dataSourcesList.dataSources;
	}

	get dataConnections() {
		return this.dataSourcesList.connections;
	}

	async start() {
		this.events.emit('starting');

		await this.dataSourcesList.start();

		this.handlers.add('GET', '/alive', (req, reply) => {
			const upstreamAliveRequests = [];
			for (const i in this.upstream) {
				upstreamAliveRequests.push(
					this.upstream[i].get('/alive').catch(err => ({ error: err })));
			}
			Promise.all(upstreamAliveRequests).then((result) => {
				const upstreamResult = [];
				let j = 0;
				for (const i in this.upstream) {
					upstreamResult.push({ name: this.upstream[i].name, result: result[j] });
					j++;
				}
				const status = {
					status: 200,
					description: 'OK',
					upstreams: [],
				};
				if (!result.every(x => !x.error)) {
					status.status = 207;
					status.description = 'Some upstream services defunct';
				}
				upstreamResult.forEach((x) => {
					status.upstreams.push(x);
				});
				return reply(status).code(status.status);
			});
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
