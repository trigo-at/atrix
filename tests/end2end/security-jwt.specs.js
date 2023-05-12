'use strict';

/* eslint-env node, mocha */
/* eslint prefer-arrow-callback: 0, func-names: 0, space-before-function-paren: 0 */

const atrix = require('../..');
const Chance = require('chance');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const expect = require('chai').expect;
const axios = require('axios');
const qs = require('querystring');
const { validate } = require('compare-versions');

const chance = new Chance();
describe('Security: JWT', () => {
    let svc;
    let service;
    describe('Static jwt config', () => {
        before(async () => {
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
                        jwt: {
                            secret: 'changeme',
                            algorithm: 'HS256',
                        },
                    },
                    endpoints: {
                        jwt: ['/data.*'],
                    }
                },
            });

            service.handlers.add('GET', '/data', (req, reply) => reply({ foo: 'bar' }));

            service.handlers.add('GET', '/test', (req, reply) => reply({ foo: 'bar' }));

            await service.start();
            svc = supertest(`http://localhost:${port}`);
        });

        after(async () => {
            await service.stop();
        });

        it('GET /data is secured', async () => {
            const res = await svc.get('/data');
            expect(res.statusCode).to.equal(401);
        });

        it('GET /test is not secured', async () => {
            const res = await svc.get('/test');
            expect(res.statusCode).to.equal(200);
        });

        it('GET /data can access with valid token', async () => {
            const token = jwt.sign({ foo: 'bar' }, 'changeme');
            const res = await svc.get('/data').set({ Authorization: `Bearer ${token}` });
            expect(res.statusCode).to.equal(200);
        });
    });

    describe('Use JWKS to fetch keys', () => {
        let validateUserCalled = 0;
        before(async () => {
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
                        jwt: {
                            jwks: {
                                jwksUri: process.env.INTERGRATION_TEST_SECURITY_JWT_JWKS_URI || 'https://sso.apps.ocp.trigo.cloud/auth/realms/atrix-test-realm/protocol/openid-connect/certs',
                            },
                            verifyOptions: {
                                issuer: process.env.INTERGRATION_TEST_SECURITY_JWT_ISSUER || 'https://sso.apps.ocp.trigo.cloud/auth/realms/atrix-test-realm',
                                audience: process.env.INTERGRATION_TEST_SECURITY_JWT_AUDIENCE || 'account',
                                algorithms: ['RS256', 'RS512'],
                            },
                            validateUser: async (token, request, h) => {
                                //console.log(token);
                                validateUserCalled++;
                                return { isValid: true };
                            }
                        },
                    },
                    endpoints: {
                        jwt: ['/data.*'],
                    }
                },
            });

            service.handlers.add('GET', '/data', (req, reply) => reply({ foo: 'bar' }));

            service.handlers.add('GET', '/test', (req, reply) => reply({ foo: 'bar' }));

            await service.start();
            svc = supertest(`http://localhost:${port}`);
        });

        after(async () => {
            await service.stop();
        });

        it('GET /data is secured', async () => {
            const res = await svc.get('/data');
            expect(res.statusCode).to.equal(401);
        });

        it('GET /test is not secured', async () => {
            const res = await svc.get('/test');
            expect(res.statusCode).to.equal(200);
        });

        //######### Test Setup using real OIDC server
        // To run the integration test using make sure to setup a reachable 
        // server and configure the following variables correctly
        //
        // INTERGRATION_TEST_SECURITY_JWT_JWKS_URI
        // INTERGRATION_TEST_SECURITY_JWT_ISSUER
        // INTERGRATION_TEST_SECURITY_JWT_AUDIENCE
        // INTERGRATION_TEST_SECURITY_JWT_GET_TEST_TOKEN_URL
        // INTERGRATION_TEST_SECURITY_JWT_GET_TEST_TOKEN_CLIENT_ID
        // INTERGRATION_TEST_SECURITY_JWT_GET_TEST_TOKEN_CLIENT_SECRET
        //
        //###############################################
        if (process.env.INTERGRATION_TEST_SECURITY_JWT_GET_TEST_TOKEN_CLIENT_SECRET) {
            const getToken = async () => {
                let tokenRes;
                try {
                    tokenRes = await axios.request({
                        url: process.env.INTERGRATION_TEST_SECURITY_JWT_GET_TEST_TOKEN_URL || 'https://sso.apps.ocp.trigo.cloud/auth/realms/atrix-test-realm/protocol/openid-connect/token',
                        method: 'post',
                        headers: { 'content-type': 'application/x-www-form-urlencoded' },
                        data: qs.stringify({
                            grant_type: 'client_credentials',
                            client_id: process.env.INTERGRATION_TEST_SECURITY_JWT_GET_TEST_TOKEN_CLIENT_ID || 'atrix-test',
                            client_secret: process.env.INTERGRATION_TEST_SECURITY_JWT_GET_TEST_TOKEN_CLIENT_SECRET,
                        })
                    });
                } catch (e) {
                    console.log(e)
                    throw e;
                }

                console.log(tokenRes.data);
                return tokenRes.data.access_token;
            }

            it('GET /data can access with valid token', async () => {
                const token = await getToken();
                const res = await svc.get('/data').set({ Authorization: `Bearer ${token}` });
                expect(res.statusCode).to.equal(200);
            });

            it('GET /data calls custom validateUser provided by config', async () => {
                const token = await getToken();
                const res = await svc.get('/data').set({ Authorization: `Bearer ${token}` });
                expect(validateUserCalled).to.gt(0);
            });
        } else {
            it.skip('Skipping JWKS integration test due to missing secret INTERGRATION_TEST_SECURITY_JWT_GET_TEST_TOKEN_CLIENT_SECRET');
        }
    })
});
