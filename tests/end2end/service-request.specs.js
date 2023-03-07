'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0, no-unused-expressions: 0 */

// const svc = require('./services').loadFromDir;
// const expect = require('chai').expect;
const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const expect = require('chai').expect;

const chance = new Chance();

describe('service.request() interface', () => {
    let svc;
    let service;
    before(async () => {
        const port = chance.integer({ min: 20000, max: 30000 });
        service = atrix.addService({
            name: 'serviceRequest',
            endpoints: {
                http: {
                    port,
                    handlerDir: `${__dirname}/load-handlers-from-dir`,
                    cors: true,
                    requestLogger: {
                        enabled: false,
                        logFullRequest: true,
                        logFullResponse: true,
                    },
                },
            },
        });
        service.handlers.add('POST', '/called-by-called-by-called-by-with-internal', async (req, reply) => {
            reply({
                reqId: req.info.id,
                headers: req.headers,
            });
        });
        service.handlers.add('POST', '/called-by-called-by-with-internal', async (req, reply, s) => {
            const innerHeaders = await s.request(
                {
                    method: 'post',
                    url: '/called-by-called-by-called-by-with-internal',
                },
                req
            );
            reply({
                reqId: req.info.id,
                headers: req.headers,
                inner: innerHeaders.result,
            });
        });

        service.handlers.add('POST', '/called-by-with-internal', async (req, reply, s) => {
            const innerHeaders = await s.request(
                {
                    method: 'post',
                    url: '/called-by-called-by-with-internal',
                },
                req
            );
            reply({
                reqId: req.info.id,
                headers: req.headers,
                inner: innerHeaders.result,
            });
        });

        service.handlers.add('POST', '/with-internal', async (req, reply, s) => {
            const innerHeaders = await s.request(
                {
                    method: 'post',
                    url: '/called-by-with-internal',
                },
                req
            );
            reply({
                reqId: req.info.id,
                headers: req.headers,
                inner: innerHeaders.result,
            });
        });

        await service.start();
        svc = supertest(`http://localhost:${port}`);
    });

    after(async () => {
        await service.stop();
    });

    it('returns headers', async () => {
        const res = await svc.get('/service-request');
        expect(res.body.headers).to.be.an('object');
    });

    it('returns statusCode', async () => {
        const res = await svc.get('/service-request');
        expect(res.body.statusCode).to.equal(200);
    });

    it('returns result', async () => {
        const res = await svc.get('/service-request');
        expect(res.body.result).to.eql({ res: 'POST /{id}' });
    });

    it('returns statusMessage', async () => {
        const res = await svc.get('/service-request');
        expect(res.body.statusMessage).to.eql('OK');
    });

    it('returns payload', async () => {
        const res = await svc.get('/service-request');
        expect(res.body.payload).to.eql('{"res":"POST /{id}"}');
    });

    it('returns rawPayload', async () => {
        const res = await svc.get('/service-request');
        expect(Buffer.from(res.body.rawPayload).toString()).to.equal('{"res":"POST /{id}"}');
    });

    it('sets the outermost req_id as "x-atrix-context-req-id" header on all internal calls', async () => {
        const res = await svc.post('/with-internal');

        const contextRequestId = res.body.reqId;
        expect(contextRequestId).to.exist;
        const contextRequestIdHeader = res.body.headers['x-atrix-context-req-id'];
        expect(contextRequestIdHeader).to.eql(contextRequestId);

        const innerReqId = res.body.inner.reqId;
        const innerContextRequestId = res.body.inner.headers['x-atrix-context-req-id'];
        expect(innerContextRequestId).to.exist;
        expect(innerContextRequestId).to.eql(contextRequestId);

        const innerParentRequestId = res.body.inner.headers['x-atrix-parent-req-id'];
        expect(innerParentRequestId).to.exist;
        expect(innerParentRequestId).to.eql(contextRequestId);

        const innerInnerContetextRequestId = res.body.inner.inner.headers['x-atrix-context-req-id'];
        expect(innerInnerContetextRequestId).to.eql(contextRequestId);
        const innerInnerParentRequestId = res.body.inner.inner.headers['x-atrix-parent-req-id'];
        expect(innerInnerParentRequestId).to.eql(innerReqId);
    });
});
