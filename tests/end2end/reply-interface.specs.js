'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, one-var: 0, no-unused-expressions: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const {expect} = require('chai');

const chance = new Chance();

describe('Handler reply interface', () => {
    let port, svc, service;

    beforeEach(async () => {
        port = chance.integer({min: 20000, max: 30000});
        service = atrix.addService({
            name: 'svc',
            endpoints: {
                http: {
                    port,
                },
            },
        });

        svc = supertest(`http://localhost:${port}`);
    });

    afterEach(async () => {
        await atrix.services.svc.stop();
    });

    it('can return with "reply(value)"', async () => {
        service.handlers.add('GET', '/', (req, reply) => reply({foo: 'bar'}));
        await atrix.services.svc.start();
        const res = await svc.get('/');
        expect(res.body).to.eql({foo: 'bar'});
        expect(res.statusCode).to.eql(200);
    });

    it('can return with reply()', async () => {
        service.handlers.add('GET', '/', (req, reply) => reply());
        await atrix.services.svc.start();
        const res = await svc.get('/');
        expect(res.text).to.eql('');
        expect(res.body).to.eql({});
        expect(res.statusCode).to.eql(200);
    });

    it('can return with reply().code(204)', async () => {
        service.handlers.add('GET', '/', (req, reply) => reply().code(204));
        await atrix.services.svc.start();
        const res = await svc.get('/');
        expect(res.text).to.eql('');
        expect(res.body).to.eql({});
        expect(res.statusCode).to.eql(204);
    });

    it('can return with reply().redirect("http://www.google.com")', async () => {
        service.handlers.add('GET', '/', (req, reply) => reply().redirect('http://www.google.com'));
        await atrix.services.svc.start();
        const res = await svc.get('/');
        expect(res.text).to.eql('');
        expect(res.body).to.eql({});
        expect(res.statusCode).to.eql(302);
        expect(res.headers.location).to.eql('http://www.google.com');
    });

    it('can return with reply().redirect("http://www.google.com").temporary()', async () => {
        service.handlers.add('GET', '/', (req, reply) =>
            reply()
                .redirect('http://www.google.com')
                .temporary()
        );
        await atrix.services.svc.start();
        const res = await svc.get('/');
        expect(res.text).to.eql('');
        expect(res.body).to.eql({});
        expect(res.statusCode).to.eql(302);
        expect(res.headers.location).to.eql('http://www.google.com');
    });

    it('can return with reply().redirect("http://www.google.com").permanent()', async () => {
        service.handlers.add('GET', '/', (req, reply) =>
            reply()
                .redirect('http://www.google.com')
                .permanent()
        );
        await atrix.services.svc.start();
        const res = await svc.get('/');
        expect(res.text).to.eql('');
        expect(res.body).to.eql({});
        expect(res.statusCode).to.eql(301);
        expect(res.headers.location).to.eql('http://www.google.com');
    });

    it('the hander can omit return statement', async () => {
        service.handlers.add('GET', '/', (req, reply) => {
            reply()
                .redirect('http://www.google.com')
                .permanent();
        });
        await atrix.services.svc.start();
        const res = await svc.get('/');
        expect(res.text).to.eql('');
        expect(res.body).to.eql({});
        expect(res.statusCode).to.eql(301);
        expect(res.headers.location).to.eql('http://www.google.com');
    });
});
