'use strict';

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
		}, {
			ATRIX_TEST_DB_CONNECTIONSTRING: 'conCfg',
			ATRIX_TEST_SWAGGER_SERVICEDEFINITION: 'sdCfg',
		});
		const sc = cfg.serviceConfig();
		expect(sc[0]).to.eql({ key: 'ATRIX_TEST_DB_CONNECTIONSTRING', defaultValue: '<UNCONFIGURED>', value: 'conCfg' });
		expect(sc[1]).to.eql({ key: 'ATRIX_TEST_SWAGGER_SERVICEDEFINITION', defaultValue: '<UNCONFIGURED>', value: 'sdCfg' });
		expect(sc[2]).to.eql({ key: 'ATRIX_TEST_ENDPOINTS_HTTP_CORS_ORIGIN_0', defaultValue: 'o1' });
		expect(sc[3]).to.eql({ key: 'ATRIX_TEST_ENDPOINTS_HTTP_CORS_ORIGIN_1', defaultValue: 'o2' });
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
