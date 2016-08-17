'use strict';
const EndpointsList = require('./EndpointsList');
const ServiceEventEmitter = require('./ServiceEventEmitter');
const Logger = require('./Logger');
const HandlerList = require('./HandlerList');
const UpstreamList = require('./UpstreamList');
const Config = require('./Config');

class Service {
	constructor(name, config) {

		process.on('SIGINT', () => {
			this.stop();
		});

		process.on('SIGTERM', () => {
			this.stop();
		});

		this.name = name;
		this.endpoints = new EndpointsList(config.endpoints);
		this.events = new ServiceEventEmitter();
		this.log = new Logger(this.name);
		this.handlers = new HandlerList(this.endpoints);
		this.upstream = new UpstreamList(config.upstream);

		this.config = new Config(this.name, config);

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
		this.endpoints.start(err => {
			if (err) throw err;
			this.events.emit('started');
		});
	}

	stop() {
		this.events.emit('stopping');
		this.endpoints.stop().then(() => {
			this.events.emit('stopped');
		});
	}
}

module.exports = Service;
