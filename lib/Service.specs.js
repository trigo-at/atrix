'use strict';

/* eslint dynamic-require: 0, global-require: 0, no-unused-expressions: 0, no-console: 0, no-unused-expressions: 0 */

const path = require('path');
const { expect } = require('chai');
const atrix = require('../index.js');

let service;
describe.only('Service', () => {
    beforeEach(async () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));
    });
    afterEach(async () => {
        atrix.config.pluginSearchPaths = [];
        try {
            await service.stop();
        } catch (e) {
            console.log(e);
        }
    });

    describe('dataSource plugins', () => {
        describe('config validation', () => {
            it('requires datasource "type" to be set', async () => {
                try {
                    service = atrix.addService({
                        name: 'service-test',
                        dataSource: {
                            ds1: {
                                config: {
                                    cfg: ['test-plugin'],
                                },
                            },
                        },
                    });
                    throw new Error('This should have thrown');
                } catch (e) {
                    expect(e.name).to.equal('ValidationError');
                    expect(e.isJoi).to.be.true;
                }
            });
            it('requires datasource "config" to be set', async () => {
                try {
                    service = atrix.addService({
                        name: 'service-test',
                        dataSource: {
                            ds1: {
                                type: 'test-plugin',
                            },
                        },
                    });
                    atrix.addService(service);
                    throw new Error('This should have thrown');
                } catch (e) {
                    expect(e.name).to.equal('ValidationError');
                    expect(e.isJoi).to.be.true;
                }
            });
        });

        it('Loads all plugin modules when adding service to atrix instance', async () => {
            const testPluginModule = require('../tests/atrix-test-plugin.js');
            const testPluginOtherModule = require('../tests/atrix-test-plugin-other.js');
            testPluginModule.reset();
            testPluginOtherModule.reset();
            service = atrix.addService({
                name: 'service-test',
                dataSource: {
                    ds1: {
                        type: 'test-plugin',
                        config: {
                            cfg: ['test-plugin'],
                        },
                    },
                    ds2: {
                        type: 'test-plugin-other',
                        config: {
                            cfg: ['test-plugin-other'],
                        },
                    },
                },
            });
            expect(testPluginModule.registerCall.atrix).to.equal(atrix);
            expect(testPluginOtherModule.registerCall.atrix).to.equal(atrix);
        });
        it('does not create plugin instance when adding service to atrix instance', async () => {
            const testPluginModule = require('../tests/atrix-test-plugin.js');
            const testPluginOtherModule = require('../tests/atrix-test-plugin-other.js');
            testPluginModule.reset();
            testPluginOtherModule.reset();
            service = atrix.addService({
                name: 'service-test',
                dataSource: {
                    ds1: {
                        type: 'test-plugin',
                        config: {
                            cfg: ['test-plugin'],
                        },
                    },
                    ds2: {
                        type: 'test-plugin-other',
                        config: {
                            cfg: ['test-plugin-other'],
                        },
                    },
                },
            });
            expect(testPluginModule.instance.constructor.name).to.eql('Object');
            expect(testPluginOtherModule.instance.constructor.name).to.eql('Object');
        });

        it('data source plugins must define a instance.start() method returning the dataConnection', async () => {
            service = atrix.addService({
                name: 'service-test',
                dataSource: {
                    ds1: {
                        type: 'test-plugin',
                        config: {
                            cfg: ['test-plugin'],
                        },
                    },
                    ds2: {
                        type: 'test-plugin-other',
                        config: {
                            cfg: ['test-plugin-other'],
                        },
                    },
                },
            });
            try {
                await service.start();
                throw new Error('This shloud have thrown a TypeError');
            } catch (e) {
                expect(e).to.be.instanceof(TypeError);
            }
        });

        it('creates plugin instances on service.start()', async () => {
            const testPluginModule = require('../tests/atrix-test-plugin.js');
            const testPluginOtherModule = require('../tests/atrix-datasource-plugin.js');
            testPluginModule.reset();
            testPluginOtherModule.reset();
            service = atrix.addService({
                name: 'service-test',
                dataSource: {
                    ds1: {
                        type: 'test-plugin',
                        config: {
                            cfg: ['test-plugin'],
                        },
                    },
                    ds2: {
                        type: 'datasource-plugin',
                        config: {
                            cfg: ['datasource-plugin'],
                        },
                    },
                },
            });
            await service.start();

            expect(testPluginModule.instance.constructor.name).to.eql('TestPlugin');
            expect(testPluginModule.factoryCall.atrix).to.equal(atrix);
            expect(testPluginModule.factoryCall.service).to.equal(service);
            expect(testPluginModule.factoryCall.config).to.eql({
                cfg: ['test-plugin'],
            });
            expect(testPluginOtherModule.instance.constructor.name).to.eql('DataSourcePlugin');
            expect(testPluginOtherModule.factoryCall.atrix).to.equal(atrix);
            expect(testPluginOtherModule.factoryCall.service).to.equal(service);
            expect(testPluginOtherModule.factoryCall.config).to.eql({
                cfg: ['datasource-plugin'],
            });
        });

        it('calls "await plugin.start()" when plugin instance defines a start method', async () => {
            const testPluginModule = require('../tests/atrix-test-plugin.js');
            const testPluginOtherModule = require('../tests/atrix-datasource-plugin.js');
            testPluginModule.reset();
            testPluginOtherModule.reset();
            service = atrix.addService({
                name: 'service-test',
                dataSource: {
                    ds1: {
                        type: 'test-plugin',
                        config: {
                            cfg: ['test-plugin'],
                        },
                    },
                    ds2: {
                        type: 'datasource-plugin',
                        config: {
                            cfg: ['datasource-plugin'],
                        },
                    },
                },
            });
            await service.start();

            expect(testPluginModule.instance.started).to.be.true;
            expect(testPluginOtherModule.instance.started).to.be.true;
        });
    });

    describe('top level plugins', () => {
        it('Loads all plugin modules when adding service to atrix instance', async () => {
            const testPluginModule = require('../tests/atrix-test-plugin.js');
            const testPluginOtherModule = require('../tests/atrix-test-plugin-other.js');
            testPluginModule.reset();
            testPluginOtherModule.reset();

            service = atrix.addService({
                name: 'service-test',
                'test-plugin': {
                    cfg: ['val'],
                },
                'test-plugin-other': {
                    cfg: ['val'],
                },
            });
            expect(testPluginModule.registerCall.atrix).to.equal(atrix);
            expect(testPluginOtherModule.registerCall.atrix).to.equal(atrix);
        });

        it('does not create plugin instance when adding service to atrix instance', async () => {
            const testPluginModule = require('../tests/atrix-test-plugin.js');
            const testPluginOtherModule = require('../tests/atrix-test-plugin-other.js');
            testPluginModule.reset();
            testPluginOtherModule.reset();
            service = atrix.addService({
                name: 'service-test',
                'test-plugin': {
                    cfg: ['val'],
                },
                'test-plugin-other': {
                    cfg: ['val'],
                },
            });
            expect(testPluginModule.instance.constructor.name).to.eql('Object');
            expect(testPluginOtherModule.instance.constructor.name).to.eql('Object');
        });

        it('creates plugin instances on service.start()', async () => {
            const testPluginModule = require('../tests/atrix-test-plugin.js');
            const testPluginOtherModule = require('../tests/atrix-test-plugin-other.js');
            testPluginModule.reset();
            testPluginOtherModule.reset();
            service = atrix.addService({
                name: 'service-test',
                'test-plugin': {
                    cfg: ['test-plugin'],
                },
                'test-plugin-other': {
                    cfg: ['test-plugin-other'],
                },
            });
            await service.start();

            expect(testPluginModule.instance.constructor.name).to.eql('TestPlugin');
            expect(testPluginModule.factoryCall.atrix).to.equal(atrix);
            expect(testPluginModule.factoryCall.service).to.equal(service);
            expect(testPluginModule.factoryCall.config).to.eql({
                cfg: ['test-plugin'],
            });
            expect(testPluginOtherModule.instance.constructor.name).to.eql('TestPluginOther');
            expect(testPluginOtherModule.factoryCall.atrix).to.equal(atrix);
            expect(testPluginOtherModule.factoryCall.service).to.equal(service);
            expect(testPluginOtherModule.factoryCall.config).to.eql({
                cfg: ['test-plugin-other'],
            });
        });

        it('calls "await plugin.start()" when plugin instance defines a start method', async () => {
            const testPluginModule = require('../tests/atrix-test-plugin.js');
            const testPluginOtherModule = require('../tests/atrix-test-plugin-other.js');
            testPluginModule.reset();
            testPluginOtherModule.reset();
            service = atrix.addService({
                name: 'service-test',
                'test-plugin': {
                    cfg: ['test-plugin'],
                },
                'test-plugin-other': {
                    cfg: ['test-plugin-other'],
                },
            });
            await service.start();

            expect(testPluginModule.instance.started).to.be.true;
            expect(testPluginOtherModule.instance.started).not.to.exist;
        });
    });
});
