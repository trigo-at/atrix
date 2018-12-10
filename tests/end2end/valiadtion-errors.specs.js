'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, one-var: 0, no-unused-expressions: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const {expect} = require('chai');
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
        port = chance.integer({min: 20000, max: 30000});
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

    it('per default verbose errors are disabled', async () => {
        await start({});
        service.handlers.add('POST', '/', (req, reply) => reply({foo: 'bar'}), {
            validate: {
                payload: schema,
            },
        });
        await atrix.services.svc.start();
        const res = await svc.post('/').send({foo: 'bar', key: 'adsf', sub: {key: 'as'}});
        expect(res.statusCode).to.eql(400);
        expect(res.body.message).to.eql('Invalid request payload input');
    });

    it('{ validation: { verbose: [".*"] } } => enables verbose errors for all routes', async () => {
        await start({
            verbose: ['.*'],
        });
        service.handlers.add('POST', '/', (req, reply) => reply({foo: 'bar'}), {validate: {payload: schema}});
        service.handlers.add('POST', '/andere', (req, reply) => reply({foo: 'bar'}), {validate: {payload: schema}});
        service.handlers.add('POST', '/no/ane', (req, reply) => reply({foo: 'bar'}), {validate: {payload: schema}});
        await atrix.services.svc.start();
        for (const path of ['/', '/andere', '/no/ane']) {
            const res = await svc.post(path).send({foo: 'bar', key: 'adsf', sub: {key: 'as'}});
            expect(res.statusCode).to.eql(400);
            expect(res.body.message).not.to.eql('Invalid request payload input');
            expect(res.body.details).to.be.an('array');
        }
    });

    it('} => errors contain all failed rules', async () => {
        await start({
            verbose: ['.*'],
        });
        service.handlers.add('POST', '/', (req, reply) => reply({foo: 'bar'}), {validate: {payload: schema}});
        service.handlers.add('POST', '/andere', (req, reply) => reply({foo: 'bar'}), {validate: {payload: schema}});
        service.handlers.add('POST', '/no/ane', (req, reply) => reply({foo: 'bar'}), {validate: {payload: schema}});
        await atrix.services.svc.start();
        for (const path of ['/', '/andere', '/no/ane']) {
            const res = await svc.post(path).send({foo: 'bar', key: 'adsf', sub: {key: 'as'}});
            expect(res.statusCode).to.eql(400);
            expect(res.body.message).not.to.eql('Invalid request payload input');
            expect(res.body.details).to.be.an('array');
            expect(res.body.details.length).to.eql(2);
        }
    });

    it('{ validation: { verbose: ["/", "^/.*ne$"] } } => use endpoints expressions to select specific routes only', async () => {
        await start({
            verbose: ['^/$', '^/.*ne$'],
        });
        service.handlers.add('POST', '/', (req, reply) => reply({foo: 'bar'}), {validate: {payload: schema}});
        service.handlers.add('POST', '/andere', (req, reply) => reply({foo: 'bar'}), {validate: {payload: schema}});
        service.handlers.add('POST', '/no/ane', (req, reply) => reply({foo: 'bar'}), {validate: {payload: schema}});
        await atrix.services.svc.start();
        for (const path of ['/', '/no/ane']) {
            const res = await svc.post(path).send({foo: 'bar', key: 'adsf', sub: {key: 'as'}});
            expect(res.statusCode).to.eql(400);
            expect(res.body.message).not.to.eql('Invalid request payload input');
            expect(res.body.details).to.be.an('array');
            expect(res.body.details.length).to.eql(2);
        }
        const res = await svc.post('/andere').send({foo: 'bar', key: 'adsf', sub: {key: 'as'}});
        expect(res.statusCode).to.eql(400);
        expect(res.body.message).to.eql('Invalid request payload input');
    });
});
