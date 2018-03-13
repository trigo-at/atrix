'use strict';

const {expect} = require('chai');
const Config = require('./Config');

describe('Config', () => {
	it('replaces keys with environment variables', () => {
		expect(
			new Config(
				'test',
				{
					db: {
						connectionString: '<UNCONFIGURED>',
					},
					swagger: {
						serviceDefinition: '<UNCONFIGURED>',
					},
				},
				{
					ATRIX_TEST_DB_CONNECTIONSTRING: 'conCfg',
					ATRIX_TEST_SWAGGER_SERVICEDEFINITION: 'sdCfg',
				}
			).config
		).to.eql({
			db: {
				connectionString: 'conCfg',
			},
			swagger: {
				serviceDefinition: 'sdCfg',
			},
		});
	});
});
