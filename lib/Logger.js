'use strict';

const bunyan = require('bunyan');

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
	const loggerCfg = {
		name: options.name || 'UNNAMED LOGGER',
		level: options.level || 'info',
	};
	// console.log('loger opts', options)
	// console.log('loger opts final', loggerCfg);
	if (process.env.NODE_ENV !== 'test') {
		log = bunyan.createLogger(loggerCfg);
	} else if (process.env.I_WANT_TEST_LOGGING) {
		log = consoleLogger;
	} else {
		log = nullLogger;
	}

	log.options = loggerCfg;
	log.createLogger = bunyanOptions => setupLogger(bunyanOptions);

	return log;
}

module.exports = setupLogger({});
