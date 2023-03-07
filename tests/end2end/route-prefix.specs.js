'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();

describe('route-prefix', () => {
    let svc;
    let service;
    before(async () => {
        const port = chance.integer({ min: 20000, max: 30000 });
        service = atrix.addService({
            name: 'routeprefix',
            endpoints: {
                http: {
                    port,
                    handlerDir: `${__dirname}/route-prefix`,
                    prefix: '/events/api',
                },
            },
            settings: {
                test: {
                    key: 'value',
                },
            },
        });

        await service.start();
        svc = supertest(`http://localhost:${port}`);
    });

    after(async () => {
        await service.stop();
    });

    it('routes are prefixed with the supllied value', async () => {
        const res = await svc.get('/events/api/');
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.eql({
            test: {
                key: 'value',
            },
        });
    });

    it('prepends the prefix when using service.request API', async () => {
        const res = await svc.post('/events/api/call_get');
        expect(res.statusCode).to.equal(200);

        expect(res.body).to.eql({
            test: {
                key: 'value',
            },
        });
    });
});
