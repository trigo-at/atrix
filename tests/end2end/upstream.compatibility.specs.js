'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, one-var: 0, no-unused-expressions: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const { expect } = require('chai');

const chance = new Chance();

describe('Upstream compatibility', () => {
    let upstreamPort, port, svc;

    before(async () => {
        upstreamPort = chance.integer({ min: 10000, max: 20000 });
        const upstream = atrix.addService({
            name: 'upstream',
            endpoints: {
                http: {
                    port: upstreamPort,
                },
            },
        });

        upstream.handlers.add('GET', '/', (req, reply) => reply({ foo: 'bar' }));

        await atrix.services.upstream.start();

        port = chance.integer({ min: 20001, max: 30000 });
        const service = atrix.addService({
            name: 'svc',
            endpoints: {
                http: {
                    port,
                },
            },
            upstream: {
                upstream: {
                    url: `http://localhost:${upstreamPort}`,
                    retry: {
                        max_tries: 3,
                        interval: 100,
                        auto: true,
                    },
                },
            },
        });

        service.handlers.add('GET', '/', async (req, reply, s) => {
            const ur = await s.upstream.upstream.get('/');
            reply(ur.body).code(ur.status);
        });

        await atrix.services.svc.start();
        svc = supertest(`http://localhost:${port}`);
    });

    after(async () => {
        await atrix.services.upstream.stop();
        await atrix.services.svc.stop();
    });

    it('can call upstream', async () => {
        const res = await svc.get('/');
        expect(res.body).to.eql({ foo: 'bar' });
    });

    it('result is formated correctly', async () => {
        const res = await svc.get('/');
        expect(res.body).to.exist;
    });

    it('result has a status code', async () => {
        const res = await svc.get('/');
        expect(res.statusCode).to.eql(200);
    });
    //
    it('result has a body', async () => {
        const res = await svc.get('/');
        expect(res.body).to.eql({ foo: 'bar' });
    });
});
