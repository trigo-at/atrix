'use strict';
const EndpointsList = require('./EndpointsList');
const ServiceEventEmitter = require('./ServiceEventEmitter');
const Logger = require('./Logger');
const HandlerList = require('./HandlerList');
const UpstreamList = require('./UpstreamList');
const Config = require('./Config');

class Service {
	constructor(name, config) {

		this.name = name;
		this.config = new Config(this.name, config);

		process.on('SIGINT', () => {
			this.stop();
		});

		process.on('SIGTERM', () => {
			this.stop();
		});

		this.endpoints = new EndpointsList(this, this.config.config.endpoints);
		this.events = new ServiceEventEmitter();
		this.log = new Logger(this.name, this.config.config.logger);
		this.handlers = new HandlerList(this.endpoints);
		this.upstream = new UpstreamList(this.config.config.upstream);


		this.events.on('starting', () => {
			this.log.info('Settings: ' + JSON.stringify(this.config || {}));
		});

		this.events.on('started', () => {
			this.log.info('Started.');
		});

		this.events.on('stopped', () => {
			this.log.info('Stopped.');
		});
	};

	start() {
		this.events.emit('starting');

		this.handlers.add('GET', '/alive', (req, reply) => {
			let upstreamAliveRequests = [];
			for (let i in this.upstream) {
				upstreamAliveRequests.push(
					this.upstream[i].get('/alive').catch(err => {
						return { error: err };
					}));
			}
			Promise.all(upstreamAliveRequests).then(result => {
				let upstreamResult = [];
				var j = 0;
				for (let i in this.upstream) {
					upstreamResult.push({name: this.upstream[i].name, result: result[j]});
					j++;
				}
				let status = {
					status: 200,
					description: 'OK',
					upstreams: []
				};
				if (!result.every(x => !x.error)) {
					status.status = 207;
					status.description = 'Some upstream services defunct';
				}
				upstreamResult.forEach(x => {
					status.upstreams.push(x);
				});
				return reply(status).code(status.status);
			});
		});
		this.endpoints.start(err => {
			if (err) throw err;
			this.events.emit('started');
		});
	}

	stop() {
		this.events.emit('stopping');
		this.endpoints.stop(err => {
			if (err) throw err;
			this.events.emit('stopped');
		});
	}
}

module.exports = Service;
