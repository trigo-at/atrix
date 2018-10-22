'use strict';

/* eslint max-len: 0 */

const { expect } = require('chai');
const Config = require('./Config');

describe('Config', () => {
	it('replaces keys with environment variables', () => {
		expect(new Config('test', {
			db: {
				connectionString: '<UNCONFIGURED>',
			},
			swagger: {
				serviceDefinition: '<UNCONFIGURED>',
			},
		}, {
			ATRIX_TEST_DB_CONNECTIONSTRING: 'conCfg',
			ATRIX_TEST_SWAGGER_SERVICEDEFINITION: 'sdCfg',
		}).config).to.eql({
			db: {
				connectionString: 'conCfg',
			},
			swagger: {
				serviceDefinition: 'sdCfg',
			},
			logger: {
				level: 'info',
			},
		});
	});


	it('replaces existing array values', () => {
		expect(new Config('test', {
			endpoints: {
				http: {
					cors: {
						origin: ['o1', 'o2'],
					},
				},
			},
		}, {
			ATRIX_TEST_ENDPOINTS_HTTP_CORS_ORIGIN_0: 'mod1',
			ATRIX_TEST_ENDPOINTS_HTTP_CORS_ORIGIN_1: 'mod2',
		}).config).to.eql({
			endpoints: {
				http: {
					cors: {
						origin: ['mod1', 'mod2'],
					},
				},
			},
			logger: {
				level: 'info',
			},
		});
	});

	it('adds "logger" section when missing', () => {
		expect(new Config('test', {}, {}).config).to.eql({
			logger: {
				level: 'info',
			},
		});
	});

	it('adds "logger.level" setting when missing', () => {
		expect(new Config('test', { logger: {} }, {}).config).to.eql({
			logger: {
				level: 'info',
			},
		});
	});

	it('sets "logger.level" setting form env', () => {
		expect(new Config('test', { logger: { level: 'error' } }, {
			ATRIX_TEST_LOGGER_LEVEL: 'warn',
		}).config).to.eql({
			logger: {
				level: 'warn',
			},
		});
	});

	it('preserves all other "logger.*" settings', () => {
		expect(new Config('test', { logger: {
			level: 'info',
			otherStuff: {
				is: {
					set: '42',
				},
			},
		} }, {
			ATRIX_TEST_LOGGER_OTHERSTUFF_IS_SET: 'asdf',
		}).config).to.eql({
			logger: {
				level: 'info',
				otherStuff: {
					is: {
						set: '42',
					},
				},
			},
		});
	});

	it('ignores env variable referencing non-existing array indices', () => {
		expect(new Config('test', {
			endpoints: {
				http: {
					cors: {
						origin: ['o1'],
					},
				},
			},
		}, {
			ATRIX_TEST_ENDPOINTS_HTTP_PROP: 'prop',
			ATRIX_TEST_ENDPOINTS_HTTP_CORS_ORIGIN_0: 'mod1',
			ATRIX_TEST_ENDPOINTS_HTTP_CORS_ORIGIN_1: 'mod2',
		}).config).to.eql({
			endpoints: {
				http: {
					cors: {
						origin: ['mod1'],
					},
				},
			},
			logger: {
				level: 'info',
			},
		});
	});

	it('returns full serviceConfig()', () => {
		const cfg = new Config('test', {
			db: {
				connectionString: '<UNCONFIGURED>',
			},
			swagger: {
				serviceDefinition: '<UNCONFIGURED>',
			},
			endpoints: {
				http: {
					cors: {
						origin: ['o1', 'o2'],
					},
				},
			},
			logger: {
				level: 'error',
			},
		}, {
			ATRIX_TEST_DB_CONNECTIONSTRING: 'conCfg',
			ATRIX_TEST_SWAGGER_SERVICEDEFINITION: 'sdCfg',
			ATRIX_TEST_LOGGER_LEVEL: 'info',
		});
		const sc = cfg.serviceConfig();
		expect(sc[0]).to.eql({ key: 'ATRIX_TEST_DB_CONNECTIONSTRING', defaultValue: '<UNCONFIGURED>', value: 'conCfg', path: ['db', 'connectionString'] });
		expect(sc[1]).to.eql({ key: 'ATRIX_TEST_SWAGGER_SERVICEDEFINITION', defaultValue: '<UNCONFIGURED>', value: 'sdCfg', path: ['swagger', 'serviceDefinition'] });
		expect(sc[2]).to.eql({ key: 'ATRIX_TEST_ENDPOINTS_HTTP_CORS_ORIGIN_0', defaultValue: 'o1', path: ['endpoints', 'http', 'cors', 'origin', 0] });
		expect(sc[3]).to.eql({ key: 'ATRIX_TEST_ENDPOINTS_HTTP_CORS_ORIGIN_1', defaultValue: 'o2', path: ['endpoints', 'http', 'cors', 'origin', 1] });
		expect(sc[4]).to.eql({ key: 'ATRIX_TEST_LOGGER_LEVEL', defaultValue: 'error', value: 'info', path: ['logger', 'level'] });
	});

	it('returned config is a clone', () => {
		const cfg = new Config('test', {
			db: {
				connectionString: '<UNCONFIGURED>',
			},
			swagger: {
				serviceDefinition: '<UNCONFIGURED>',
			},
			endpoints: {
				http: {
					cors: {
						origin: ['o1', 'o2'],
					},
				},
			},
		}, {
			ATRIX_TEST_DB_CONNECTIONSTRING: 'conCfg',
			ATRIX_TEST_SWAGGER_SERVICEDEFINITION: 'sdCfg',
		});
		expect(cfg.serviceConfig()).not.to.equal(cfg.serviceConfig());
	});
});
