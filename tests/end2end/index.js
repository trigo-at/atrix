'use strict';
const atrix = require('../..');
const upstreamEndpoint = require('../../examples/upstream-svc/config');
const testServices = require('../../examples/');
const svc = require('./services');
const expect = require('chai').expect;

setTimeout(() => {
	describe('every service instance', () => {
		describe('/alive', () => {
			it('should have alive endpoint returning 200 if everything is ok', done => { 
				svc.downstream.get('/alive').expect(200, done);
			});

			it('should return 207 if some upstream service are not available', done => {
				svc.brokenupstream.get('/alive').expect(207, done);
			});

			it('should reflect upstream service status in response', done => {
				svc.brokenupstream.get('/alive').expect(207).end((err, res) => {
					expect(res.body.upstreams[0].result).to.have.property('error');
					done();
				});
			});
		});

		describe('service endpoints', () => {
			it('should return 503 service unavailable if required upstream is not reachable');
		});
	});


	run();
}, 1000);
