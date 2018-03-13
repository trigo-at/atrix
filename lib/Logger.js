'use strict';

const bunyan = require('bunyan');
const R = require('ramda');

const consoleLogger = {
	debug: console.log, // eslint-disable-line no-console
	log: console.log, // eslint-disable-line no-console
	warn: console.warn, // eslint-disable-line no-console
	error: console.error, // eslint-disable-line no-console
	info: console.log, // eslint-disable-line no-console
};
consoleLogger.child = () => consoleLogger;

const nullLogger = {
	debug: () => {},
	log: () => {},
	warn: () => {},
	error: () => {},
	info: () => {},
};

nullLogger.child = () => nullLogger;

function setupLogger(options) {
	// console.log(options)
	let log;
	const defaultOptions = {
		name: 'UNNAMED LOGGER',
		streams: [
			{
				stream: process.stdout,
				level: 'debug',
			},
		],
	};
	// console.log('loger opts', options)
	const opt = R.merge(defaultOptions, options);
	// console.log('loger opts final', opt)
	if (process.env.NODE_ENV !== 'test') {
		log = bunyan.createLogger(opt);
	} else if (process.env.I_WANT_TEST_LOGGING) {
		log = consoleLogger;
	} else {
		log = nullLogger;
	}

	log.options = opt;
	log.createLogger = bunyanOptions => setupLogger(bunyanOptions);

	return log;
}

module.exports = setupLogger();
