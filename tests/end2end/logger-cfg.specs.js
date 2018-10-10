'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, no-unused-expressions: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;
const fs = require('fs');
const { clone } = require('ramda');
const bb = require('bluebird');
const tmp = require('tmp');

const chance = new Chance();

const defaultCfg = {
	logger: {
		level: 'debug',
		name: 'franz',
	},
	endpoints: {
		http: {
			handlerDir: `${__dirname}/logger-cfg`,
		},
	},
	settings: {
		test: {
			key: 'value',
		},
	},
};

describe('logger-cfg', () => {
	let svc;
	let service;
	let config;
	let tmpFile;
	let logFile;
	const port = chance.integer({ min: 20000, max: 30000 });

	const stopService = async () => {
		await service.stop();
		process.env.ATRIX_LOGGER_TESTS = false;
	};

	const startService = async (cfg) => {
		if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
		process.env.ATRIX_LOGGER_TESTS = true;
		service = new atrix.Service('logger', cfg);
		service.endpoints.add('http');
		atrix.addService(service);
		await service.start();
		svc = supertest(`http://localhost:${port}`);
	};

	beforeEach(() => {
		tmpFile = tmp.fileSync();
		logFile = tmpFile.name;
		config = clone(defaultCfg);
		config.endpoints.http.port = port;
		config.logger.streams = [{
			stream: process.stdout,
		}, {
			path: logFile,
		}];
	});

	it('parses logger.streams config - creates a logfile', async() => {
		await startService(config);

		const res = await svc.get('/');
		expect(res.statusCode).to.eql(200);
		await stopService();
		expect(fs.existsSync(logFile)).to.be.true;
	});

	it('level=debug', async () => {
		await startService(config);
		const res = await svc.get('/');
		expect(res.statusCode).to.eql(200);
		await stopService();

		await bb.delay(100);
		const file = fs.readFileSync(logFile, { encoding: 'utf-8' });

		['debug', 'info', 'warn', 'error'].forEach((level) => {
			expect(file).to.contain(`service.log.${level}`);
			expect(file).to.contain(`req.log.${level}`);
		});
	});

	it('level=info', async () => {
		config.logger.level = 'info';
		await startService(config);
		const res = await svc.get('/');
		expect(res.statusCode).to.eql(200);
		await stopService();

		await bb.delay(100);
		const file = fs.readFileSync(logFile, { encoding: 'utf-8' });

		['info', 'warn', 'error'].forEach((level) => {
			expect(file).to.contain(`service.log.${level}`);
			expect(file).to.contain(`req.log.${level}`);
		});
		['debug'].forEach((level) => {
			expect(file).not.to.contain(`service.log.${level}`);
			expect(file).not.to.contain(`req.log.${level}`);
		});
	});

	it('level=warn', async () => {
		config.logger.level = 'warn';
		await startService(config);
		const res = await svc.get('/');
		expect(res.statusCode).to.eql(200);
		await stopService();

		await bb.delay(100);
		const file = fs.readFileSync(logFile, { encoding: 'utf-8' });

		['warn', 'error'].forEach((level) => {
			expect(file).to.contain(`service.log.${level}`);
			expect(file).to.contain(`req.log.${level}`);
		});
		['debug', 'info'].forEach((level) => {
			expect(file).not.to.contain(`service.log.${level}`);
			expect(file).not.to.contain(`req.log.${level}`);
		});
	});

	it('level=error', async () => {
		config.logger.level = 'error';
		await startService(config);
		const res = await svc.get('/');
		expect(res.statusCode).to.eql(200);
		await stopService();

		await bb.delay(100);
		const file = fs.readFileSync(logFile, { encoding: 'utf-8' });

		['error'].forEach((level) => {
			expect(file).to.contain(`service.log.${level}`);
			expect(file).to.contain(`req.log.${level}`);
		});
		['debug', 'info', 'warn'].forEach((level) => {
			expect(file).not.to.contain(`service.log.${level}`);
			expect(file).not.to.contain(`req.log.${level}`);
		});
	});


	describe('requestLogger', () => {
		it('request logger is disabled per default', async () => {
			await startService(config);
			const res = await svc.get('/');
			expect(res.statusCode).to.eql(200);
			await stopService();

			await bb.delay(100);
			const file = fs.readFileSync(logFile, { encoding: 'utf-8' });
			expect(file).not.to.contain('"path":"/"');
		});

		it('request logs request & response per default', async () => {
			config.endpoints.http.requestLogger = { enabled: true };
			await startService(config);
			const res = await svc.post('/').send({ payload: 'ho' });
			expect(res.statusCode).to.eql(200);
			await stopService();

			await bb.delay(100);
			const file = fs.readFileSync(logFile, { encoding: 'utf-8' });
			// response
			expect(file).to.contain('"response":{"headers"');
			// full response
			expect(file).to.contain('"json":"{\\n  \\"data\\": \\"yo\\"\\n}"}');

			// request
			expect(file).to.contain('"request":{"headers"');
			// full request
			expect(file).to.contain('"json":"{\\n  \\"payload\\": \\"ho\\"\\n}"}');
		});

		it('can dissable full "request" log', async () => {
			config.endpoints.http.requestLogger = { enabled: true, logFullRequest: false };
			await startService(config);
			const res = await svc.post('/').send({ payload: 'ho' });
			expect(res.statusCode).to.eql(200);
			await stopService();

			await bb.delay(100);
			const file = fs.readFileSync(logFile, { encoding: 'utf-8' });
			// response
			expect(file).to.contain('"response":{"headers"');
			// full response
			expect(file).to.contain('"json":"{\\n  \\"data\\": \\"yo\\"\\n}"}');

			// request
			expect(file).to.contain('"request":{"headers"');
			// full request
			expect(file).not.to.contain('"json":"{\\n  \\"payload\\": \\"ho\\"\\n}"}');
		});

		it('can dissable full "response" log', async () => {
			config.endpoints.http.requestLogger = { enabled: true, logFullResponse: false };
			await startService(config);
			const res = await svc.post('/').send({ payload: 'ho' });
			expect(res.statusCode).to.eql(200);
			await stopService();

			await bb.delay(100);
			const file = fs.readFileSync(logFile, { encoding: 'utf-8' });
			// response
			expect(file).to.contain('"response":{"headers"');
			// full response
			expect(file).not.to.contain('"json":"{\\n  \\"data\\": \\"yo\\"\\n}"}');

			// request
			expect(file).to.contain('"request":{"headers"');
			// full request
			expect(file).to.contain('"json":"{\\n  \\"payload\\": \\"ho\\"\\n}"}');
		});

		it('ignores GET /alive per default', async () => {
			config.endpoints.http.requestLogger = { enabled: true, logFullResponse: false };
			await startService(config);
			const res = await svc.get('/alive');
			expect(res.statusCode).to.eql(200);
			await stopService();

			await bb.delay(100);
			const file = fs.readFileSync(logFile, { encoding: 'utf-8' });
			// response
			expect(file).not.to.contain('"response":{"headers"');
			// request
			expect(file).not.to.contain('"request":{"headers"');
		});

		it('can override default behaviour with "ignoreRoutes" setting', async () => {
			config.endpoints.http.requestLogger = { enabled: true, ignoreEndpoints: ['/'] };
			await startService(config);
			const res = await svc.post('/');
			expect(res.statusCode).to.eql(200);
			await stopService();

			await bb.delay(100);
			const file = fs.readFileSync(logFile, { encoding: 'utf-8' });
			// response
			expect(file).not.to.contain('"response":{"headers"');
			// request
			expect(file).not.to.contain('"request":{"headers"');
		});
	});
});
