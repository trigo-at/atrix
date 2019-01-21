'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../..');
const symbols = require('../../lib/symbols');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();

describe('server-attached-service', () => {
    let svc;
    let service;
    const startService = async handler => {
        const port = chance.integer({min: 20000, max: 30000});
        service = atrix.addService({
            name: 'test',
            endpoints: {
                http: {
                    port,
                },
            },
        });
        service.handlers.add('GET', '/', handler);
        await service.start();
        svc = supertest(`http://localhost:${port}`);
    };

    after(async () => {
        await service.stop();
    });

    it('"service" object is attached to at req.server.app[atrix.ATRIX_SERVICE]', async () => {
        let serverAttachedService;
        await startService(async (req, reply) => {
            serverAttachedService = req.server.app[atrix.ATRIX_SERVICE];
            return reply();
        });
        await svc.get('/');
        expect(serverAttachedService).to.equal(service);
    });
});
