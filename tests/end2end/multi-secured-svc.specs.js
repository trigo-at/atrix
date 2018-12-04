'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();

describe('muti-secured-svc', () => {
    let svc;
    let service;
    before(async () => {
        const port = chance.integer({min: 20000, max: 30000});
        service = atrix.addService({
            name: 'multiSecured',
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
                    signedlink: {
                        secret: 'test-secret',
                    },
                },
                endpoints: {
                    jwt: ['/jwt.*'],
                    signedlink: ['/signedlink.*'],
                },
            },
        });
        service.handlers.add('GET', '/jwt', (req, reply) => reply({foo: 'bar'}));
        service.handlers.add('GET', '/signedlink', (req, reply) => reply({foo: 'bar'}));

        service.handlers.add('GET', '/test', (req, reply) => reply({foo: 'bar'}));

        await service.start();
        svc = supertest(`http://localhost:${port}`);
    });

    after(async () => {
        await service.stop();
    });

    it('GET /jwt is secured', async () => {
        const res = await svc.get('/jwt');
        expect(res.statusCode).to.equal(401);
    });

    it('GET /signedlink is secured', async () => {
        const res = await svc.get('/signedlink');
        expect(res.statusCode).to.equal(401);
    });

    it('GET /test is not secured', async () => {
        const res = await svc.get('/test');
        expect(res.statusCode).to.equal(200);
    });

    it('"signedlink" strategy add "createSignedLink" utility to the service', async () => {
        const link = atrix.services.multiSecured.createSignedLink('/signedlink');
        const res = await svc.get(link);
        expect(res.statusCode).to.equal(200);
    });
});
