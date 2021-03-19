
'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const expect = require('chai').expect;

const chance = new Chance();
describe.only('Security: Basic Auth', () => {
    let svc;
    let service;
    before(async () => {
        const port = chance.integer({min: 20000, max: 30000});
        service = atrix.addService({
            name: 'secured',
            endpoints: {
                http: {
                    port,
                    cors: true,
                },
            },
            security: {
                strategies: {
                    basicAuth: {
                        secret: 'changeme',
                        algorithm: 'HS256',
                    },
                },
                endpoints: ['/secured.*'],
            },
        });

        service.handlers.add('GET', '/secured', (req, reply) => reply({foo: 'bar'}));

        service.handlers.add('GET', '/public', (req, reply) => reply({foo: 'bar'}));

        await service.start();
        svc = supertest(`http://localhost:${port}`);
    });

    after(async () => {
        await service.stop();
    });

    it('GET /secured is secured', async () => {
        const res = await svc.get('/secured');
        expect(res.statusCode).to.equal(401);
    });

    it('GET /public is not secured', async () => {
        const res = await svc.get('/public');
        expect(res.statusCode).to.equal(200);
    });
});
