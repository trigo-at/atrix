'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();

describe('signedlink-secured-svc', () => {
    let svc;
    let service;
    const startService = async (
        options = {
            secret: 'test-secret',
        }
    ) => {
        const port = chance.integer({min: 20000, max: 30000});
        service = atrix.addService({
            name: 'signedlinkSecured',
            endpoints: {
                http: {
                    port,
                    cors: true,
                },
            },
            security: {
                strategies: {
                    signedlink: options,
                },
                endpoints: {
                    signedlink: ['/signedlink.*'],
                },
            },
        });
        service.handlers.add('GET', '/signedlink', (req, reply) => reply({foo: 'bar'}));

        service.handlers.add('GET', '/test', (req, reply) => reply({foo: 'bar'}));

        await service.start();
        svc = supertest(`http://localhost:${port}`);
    };

    afterEach(async () => {
        await service.stop();
    });

    it('GET /signedlink is secured', async () => {
        await startService();
        const res = await svc.get('/signedlink');
        expect(res.statusCode).to.equal(401);
    });

    it('GET /signedlink is secured using "failAction" on error', async () => {
        let reas;
        await startService({
            secret: 'test-secret',
            failAction: async (request, h, reason) => {
                reas = reason;
                return h.redirect('http://www.google.com').takeover();
            },
        });

        const res = await svc.get('/signedlink');
        expect(res.statusCode).to.equal(302);
        expect(res.headers.location).to.equal('http://www.google.com');
        expect(reas).to.eql('E_AUTH_PARAM_MISSING');
    });

    it('GET /signedlink can access service using req.server.app[atrix.ATRIX_SERVICE]', async () => {
        let s;
        await startService({
            secret: 'test-secret',
            failAction: async (request, h, reason) => {
                s = request.server.app[atrix.ATRIX_SERVICE];
                return h.redirect('http://www.google.com').takeover();
            },
        });

        const res = await svc.get('/signedlink');
        expect(res.statusCode).to.equal(302);
        expect(res.headers.location).to.equal('http://www.google.com');
        expect(s).to.equal(service);
    });

    it('GET /test is not secured', async () => {
        await startService();
        const res = await svc.get('/test');
        expect(res.statusCode).to.equal(200);
    });

    it('"signedlink" strategy add "createSignedLink" utility to the service', async () => {
        await startService();
        const link = atrix.services.signedlinkSecured.createSignedLink('/signedlink');
        const res = await svc.get(link);
        expect(res.statusCode).to.equal(200);
    });
});
