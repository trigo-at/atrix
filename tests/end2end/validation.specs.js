'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, one-var: 0, no-unused-expressions: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const { expect } = require('chai');
const Joi = require('joi');

const chance = new Chance();

describe('HTTP Endpoint validation settings', () => {
    let port, svc, service;

    const schema = Joi.object({
        key: Joi.string().required(),
        sub: Joi.object({
            key: Joi.string()
                .valid('val1', 'val2')
                .required(),
        }).required(),
    });
    const start = async validation => {
        port = chance.integer({ min: 20000, max: 30000 });
        service = atrix.addService({
            name: 'svc',
            endpoints: {
                http: {
                    port,
                    validation,
                },
            },
        });

        svc = supertest(`http://localhost:${port}`);
    };

    afterEach(async () => {
        await atrix.services.svc.stop();
    });

    describe('unknown keys & stripping', () => {
        it('default setting do not allow unknown keys', async () => {
            await start({
                verboseEndpoints: ['.*'],
            });
            service.handlers.add('POST', '/', (req, reply) => reply(req.payload), {
                validate: {
                    payload: Joi.object({
                        name: Joi.string(),
                    }),
                },
            });
            await atrix.services.svc.start();
            const res = await svc.post('/').send({ notName: 'asdf' });
            expect(res.statusCode).to.eql(400);
            expect(res.body.details[0].type).to.eql('object.unknown');
        });

        it('disabling strictEndpoints validation allows unknown keys', async () => {
            await start({
                verboseEndpoints: ['.*'],
                strictEndpoints: [],
            });
            service.handlers.add('POST', '/', (req, reply) => reply(req.payload), {
                validate: {
                    payload: Joi.object({
                        name: Joi.string(),
                    }),
                },
            });
            await atrix.services.svc.start();
            const res = await svc.post('/').send({ notName: 'asdf' });
            expect(res.statusCode).to.eql(200);
        });
        it('with strictEndpoints validation disable unknonw keys are stripped before passed to the handler', async () => {
            await start({
                verboseEndpoints: ['.*'],
                strictEndpoints: [],
            });
            service.handlers.add('POST', '/', (req, reply) => reply(req.payload), {
                validate: {
                    payload: Joi.object({
                        name: Joi.string(),
                    }),
                },
            });
            await atrix.services.svc.start();
            const res = await svc.post('/').send({ notName: 'asdf', name: 'franz' });
            expect(res.statusCode).to.eql(200);
            expect(res.body).to.eql({ name: 'franz' });
        });
    });

    describe('verboseEndpoints validation errors', () => {
        it('per default verboseEndpoints errors are disabled', async () => {
            await start({});
            service.handlers.add('POST', '/', (req, reply) => reply({ foo: 'bar' }), {
                validate: {
                    payload: schema,
                },
            });
            await atrix.services.svc.start();
            const res = await svc.post('/').send({ foo: 'bar', key: 'adsf', sub: { key: 'as' } });
            expect(res.statusCode).to.eql(400);
            expect(res.body.message).to.eql('Invalid request payload input');
        });

        it('{ validation: { verboseEndpoints: [".*"] } } => enables verboseEndpoints errors for all routes', async () => {
            await start({
                verboseEndpoints: ['.*'],
            });
            service.handlers.add('POST', '/', (req, reply) => reply({ foo: 'bar' }), { validate: { payload: schema } });
            service.handlers.add('POST', '/andere', (req, reply) => reply({ foo: 'bar' }), { validate: { payload: schema } });
            service.handlers.add('POST', '/no/ane', (req, reply) => reply({ foo: 'bar' }), { validate: { payload: schema } });
            await atrix.services.svc.start();
            for (const path of ['/', '/andere', '/no/ane']) {
                const res = await svc.post(path).send({ foo: 'bar', key: 'adsf', sub: { key: 'as' } });
                expect(res.statusCode).to.eql(400);
                expect(res.body.message).not.to.eql('Invalid request payload input');
                expect(res.body.details).to.be.an('array');
            }
        });

        it('} => errors contain all failed rules', async () => {
            await start({
                verboseEndpoints: ['.*'],
            });
            service.handlers.add('POST', '/', (req, reply) => reply({ foo: 'bar' }), { validate: { payload: schema } });
            service.handlers.add('POST', '/andere', (req, reply) => reply({ foo: 'bar' }), { validate: { payload: schema } });
            service.handlers.add('POST', '/no/ane', (req, reply) => reply({ foo: 'bar' }), { validate: { payload: schema } });
            await atrix.services.svc.start();
            for (const path of ['/', '/andere', '/no/ane']) {
                const res = await svc.post(path).send({ foo: 'bar', key: 'adsf', sub: { key: 'as' } });
                expect(res.statusCode).to.eql(400);
                expect(res.body.message).not.to.eql('Invalid request payload input');
                expect(res.body.details).to.be.an('array');
                expect(res.body.details.length).to.eql(2);
            }
        });

        it('{ validation: { verboseEndpoints: ["/", "^/.*ne$"] } } => use endpoints expressions to select specific routes only', async () => {
            await start({
                verboseEndpoints: ['^/$', '^/.*ne$'],
            });
            service.handlers.add('POST', '/', (req, reply) => reply({ foo: 'bar' }), { validate: { payload: schema } });
            service.handlers.add('POST', '/andere', (req, reply) => reply({ foo: 'bar' }), { validate: { payload: schema } });
            service.handlers.add('POST', '/no/ane', (req, reply) => reply({ foo: 'bar' }), { validate: { payload: schema } });
            await atrix.services.svc.start();
            for (const path of ['/', '/no/ane']) {
                const res = await svc.post(path).send({ foo: 'bar', key: 'adsf', sub: { key: 'as' } });
                expect(res.statusCode).to.eql(400);
                expect(res.body.message).not.to.eql('Invalid request payload input');
                expect(res.body.details).to.be.an('array');
                expect(res.body.details.length).to.eql(2);
            }
            const res = await svc.post('/andere').send({ foo: 'bar', key: 'adsf', sub: { key: 'as' } });
            expect(res.statusCode).to.eql(400);
            expect(res.body.message).to.eql('Invalid request payload input');
        });

        it('serializes regex patterns as string in error details', async () => {
            await start({
                verboseEndpoints: ['.*'],
            });

            service.handlers.add('POST', '/{id}', (req, reply) => reply(req.payload), {
                validate: {
                    params: Joi.object({
                        id: Joi.string().regex(/^[a-z]{3}$/),
                    }),
                },
            });

            await atrix.services.svc.start();
            const res = await svc.post('/As');
            console.log(JSON.stringify(res.body.details[0], null, 2))
            expect(res.body.details[0].message).to.contain('/^[a-z]{3}$/');
        });
    });
});
