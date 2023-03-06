'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, no-unused-expressions: 0, arrow-body-style: 0 */

const atrix = require('../');
const path = require('path');
const { expect } = require('chai');

describe.only('EndpointLists', () => {
    beforeEach(() => {
        atrix.config.reset();
        atrix.config.pluginSearchPaths.push(path.join(__dirname, '../tests'));
    });
    afterEach(() => {
        atrix.config.reset();
    });
    it('does not load "http" endpoint from plugin plugin', async () => {
        atrix.addService({ name: 'svc', endpoints: { http: {} } });
    });

    it('can load endpoint from plugin', async () => {
        atrix.addService({ name: 'svc', endpoints: { endpointplugin: {} } });
    });

    it('checks for "registerHandler" method of plugin', async () => {
        let err;
        try {
            atrix.addService({ name: 'svc', endpoints: { endpointpluginNoRegisterHandler: {} } });
        } catch (e) {
            err = e;
        }
        expect(err).to.exist;
        expect(err.message).to.eql(
            'Atrix endpoint plugin "artix-endpointplugin" does not implement mendatory method "registerHandler"'
        );
    });
    it('checks for "start" method of plugin', async () => {
        let err;
        try {
            atrix.addService({ name: 'svc', endpoints: { endpointpluginNoStart: {} } });
        } catch (e) {
            err = e;
        }
        expect(err).to.exist;
        expect(err.message).to.eql(
            'Atrix endpoint plugin "artix-endpointplugin" does not implement mendatory method "start"'
        );
    });
    it('checks for "stop" method of plugin', async () => {
        let err;
        try {
            atrix.addService({ name: 'svc', endpoints: { endpointpluginNoStop: {} } });
        } catch (e) {
            err = e;
        }
        expect(err).to.exist;
        expect(err.message).to.eql(
            'Atrix endpoint plugin "artix-endpointplugin" does not implement mendatory method "stop"'
        );
    });
});
