'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const expect = require('chai').expect;

const chance = new Chance();
describe.only('Security: JWT', () => {
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
                    jwt: {
                        secret: 'changeme',
                        algorithm: 'HS256',
                    },
                },
                endpoints: {
                    jwt: ['/data.*'],
                }
            },
        });

        service.handlers.add('GET', '/data', (req, reply) => reply({foo: 'bar'}));

        service.handlers.add('GET', '/test', (req, reply) => reply({foo: 'bar'}));

        await service.start();
        svc = supertest(`http://localhost:${port}`);
    });

    after(async () => {
        await service.stop();
    });

    it('GET /data is secured', async () => {
        const res = await svc.get('/data');
        expect(res.statusCode).to.equal(401);
    });

    it('GET /test is not secured', async () => {
        const res = await svc.get('/test');
        expect(res.statusCode).to.equal(200);
    });

    it('GET /data can accfess with valid token', async () => {
        const token = jwt.sign({foo: 'bar'}, 'changeme');
        const res = await svc.get('/data').set({Authorization: `Bearer ${token}`});
        expect(res.statusCode).to.equal(200);
    });
});
