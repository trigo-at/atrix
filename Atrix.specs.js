'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const symbols = require('./lib/symbols');
const Atrix = require('./Atrix');

const atrix = new Atrix();
const { version } = require('./package.json');

describe('atrix', () => {
    it('exposes property "config"', () => {
        expect(atrix.config).to.be.an('object');
    });

    it('cannot set property "config"', () => {
        expect(() => {
            atrix.config = {};
        }).to.throw();
    });

    it('exposes function "configure"', () => {
        expect(atrix.configure).to.be.a('function');
    });

    it('exposes "version"', () => {
        expect(atrix.version).to.eql(version);
    });

    describe('exposed symbols', () => {
        Object.keys(symbols).forEach(key => {
            it(`exposed "atrix.${key}"`, () => expect(atrix[key]).to.eql(symbols[key]));
            it(`exposed "Atrix.${key}"`, () => expect(Atrix[key]).to.eql(symbols[key]));
        });
    });
});
