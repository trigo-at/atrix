'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, one-var: 0, no-unused-expressions: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const {expect} = require('chai');

const chance = new Chance();

describe.only('Handler reply interface', () => {
    let port, svc, service;

    beforeEach(async () => {
        port = chance.integer({min: 20000, max: 30000});
        service = atrix.addService({
            name: 'svc',
            endpoints: {
                http: {
                    port,
                },
            },
        });

        svc = supertest(`http://localhost:${port}`);
    });

    afterEach(async () => {
        await atrix.services.svc.stop();
    });

    it('can return with "reply(value)"', async () => {
        service.handlers.add('GET', '/', (req, reply) => reply({foo: 'bar'}));
        await atrix.services.svc.start();
        const res = await svc.get('/');
        expect(res.body).to.eql({foo: 'bar'});
        expect(res.statusCode).to.eql(200);
    });

    it('can return with reply()', async () => {
        service.handlers.add('GET', '/', (req, reply) => reply());
        await atrix.services.svc.start();
        const res = await svc.get('/');
        console.log(res);
        expect(res.body).to.eql({});
        expect(res.statusCode).to.eql(200);
    });

});
