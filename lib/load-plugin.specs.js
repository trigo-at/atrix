'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, no-unused-expressions: 0, arrow-body-style: 0 */

const loadPlugin = require('./load-plugin');
const atrix = require('../');
const path = require('path');
const { expect } = require('chai');
const log = require('./Logger');

describe('load-plugin', () => {
    beforeEach(() => {
        atrix.config.reset();
    });

    it('tries to load from package named "@trigo/atrix-plugin"', async () => {
        expect(() => loadPlugin(atrix, 'plugin', { log })).to.throw("Cannot find module '@trigo/atrix-plugin'");
    });

    it('tries to load from fs locations in globalConfig.pluginSearchPaths with pattern atrix-<plugin-name>', async () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));
        const p = loadPlugin(atrix, 'test-plugin', { log });

        expect(p).to.exist;
    });

    it('validates plugin to contain "name" property', async () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

        expect(() => loadPlugin(atrix, 'test-plugin-no-name', { log })).to.throw('Required property "name" missing');
    });

    it('validates plugin to contain "version" property', async () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

        expect(() => loadPlugin(atrix, 'test-plugin-no-version', { log })).to.throw(
            'Required property "version" missing'
        );
    });

    it('validates plugin to contain "register" function', async () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

        expect(() => loadPlugin(atrix, 'test-plugin-no-register', { log })).to.throw(
            'Required function "register" missing'
        );
    });

    it('validates plugin to contain "compatibility" information', async () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

        expect(() => loadPlugin(atrix, 'test-plugin-no-compatibility', { log })).to.throw(
            'Required property "compatibility" missing'
        );
    });

    it('validates plugin to contain "compatibility.atrix" information', async () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

        expect(() => loadPlugin(atrix, 'test-plugin-compatibility-no-atrix', { log })).to.throw(
            'Required property "compatibility.atrix" missing'
        );
    });

    it('validates plugin to contain "compatibility.atrix.min" information', async () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

        expect(() => loadPlugin(atrix, 'test-plugin-compatibility-atrix-no-min', { log })).to.throw(
            'Required property "compatibility.atrix.min" missing'
        );
    });

    it('calls the plugin "register" function with atrix as argument', () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));
        const p = loadPlugin(atrix, 'test-plugin', { log });
        expect(p.atrix).to.equal(atrix);
    });

    it('can resolve plugin from "atrix.config.pluginMap"', () => {
        atrix.config.pluginMap['test-plugin2'] = path.join(__dirname, '../tests/atrix-test-plugin2');

        const p = loadPlugin(atrix, 'test-plugin2', { log });
        expect(p).to.exist;
    });

    it('searches atrix.config.pluginMap, and then atrix.config.pluginSearchPaths', () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));
        atrix.config.pluginMap['test-plugin2'] = path.join(__dirname, '../tests/pd/atrix-test-plugin2');

        const p = loadPlugin(atrix, 'test-plugin2', { log });
        expect(p.name).equal('test-plugin2-pd').exist;
    });

    it('throws error when plugin requires atrix version to be higher', () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

        expect(() => loadPlugin(atrix, 'test-plugin-compatibility-min-v100', { log })).to.throw(
            'Plugin "test-plugin-compatibility-min-v100@1.0.0" requires atrix >= "100.0.0"'
        );
    });

    it('throws error when plugin requires atrix version to be lower', () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));

        expect(() => loadPlugin(atrix, 'test-plugin-compatibility-min-v5', { log })).to.throw(
            'Plugin "test-plugin-compatibility-min-v5@1.0.0" requires atrix <= "5.0.0"'
        );
    });

    it('accepts exact versionmatches', () => {
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));
        expect(() => loadPlugin(atrix, 'test-plugin-compatibility-exact', { log })).not.to.throw();
    });
});
