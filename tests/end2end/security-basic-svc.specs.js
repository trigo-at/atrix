'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();
describe('Security: Basic Auth', () => {
    let svc;
    let service;
    const validate = async (request, username, password) => {
        if (
            (!username && password === 'no_username_required') ||
            (username === 'valid_user' && password === 'valid_password')
        ) {
            return { isValid: true, credentials: { username } };
        }
        return { isValid: false };
    };

    const startService = async (
        options = {
            validate,
        }
    ) => {
        const port = chance.integer({ min: 20000, max: 30000 });
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
                    basic: options,
                },
                endpoints: { basic: ['/secured.*'] },
            },
        });

        service.handlers.add('GET', '/secured', (req, reply) => reply({ foo: 'bar' }));

        service.handlers.add('GET', '/public', (req, reply) => reply({ foo: 'bar' }));

        await service.start();
        svc = supertest(`http://localhost:${port}`);
    };

    afterEach(async () => {
        await service.stop();
    });

    it('GET /secured is secured', async () => {
        await startService();
        const res = await svc.get('/secured');
        expect(res.statusCode).to.equal(401);
    });

    it('GET /secured fails with invalid user password', async () => {
        await startService();
        const auth = `Basic ${Buffer.from("user:password").toString("base64")}`;
        const res = await svc.get('/secured').set({ Authorization: auth });
        expect(res.statusCode).to.equal(401);
    });

    it('GET /secured works with valid user password', async () => {
        await startService();
        const auth = `Basic ${Buffer.from("valid_user:valid_password").toString("base64")}`;
        const res = await svc.get('/secured').set({ Authorization: auth });
        expect(res.statusCode).to.equal(200);
    });

    describe('allow empty password', () => {
        it('can send empty username', async () => {
            await startService({
                validate,
                allowEmptyUsername: true
            });
            const auth = `Basic ${Buffer.from(":no_username_required").toString("base64")}`;
            const res = await svc.get('/secured').set({ Authorization: auth });
            expect(res.statusCode).to.equal(200);
        });
    });


    it('GET /public is not secured', async () => {
        await startService();
        const res = await svc.get('/public');
        expect(res.statusCode).to.equal(200);
    });
});
