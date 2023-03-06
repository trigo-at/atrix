'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const should = require('chai').should();
const ServicesList = require('./ServicesList');

class ServiceMock {
    constructor(name = 'gandalf') {
        this.name = name;
        this.stopped = false;
        this.instance = {
            stop: () => {
                this.stopped = true;
                return true;
            },
        };
    }

    setAtrix(atrix) {
        this.atrix = atrix;
    }
}

describe.only('ServicesList', () => {
    it('create ServicesList', () => {
        const serviceList = new ServicesList({});
        should.exist(serviceList);
    });

    it('should initialice services list', () => {
        const serviceList = new ServicesList({});
        serviceList.services.should.deep.equal({});
    });

    it('should set Atrix instance', () => {
        const atrixMock = {};
        const serviceList = new ServicesList(atrixMock);
        serviceList.atrix.should.equal(atrixMock);
    });

    it('should add service', () => {
        const atrixMock = {};
        const serviceMock = new ServiceMock();
        const serviceList = new ServicesList(atrixMock);
        serviceList.addService(serviceMock);
        serviceList.services.gandalf.should.equal(serviceMock);
        serviceMock.atrix.should.equal(atrixMock);
    });

    it('should stop services', async () => {
        const atrixMock = {};
        const serviceMock = new ServiceMock();
        const serviceList = new ServicesList(atrixMock);
        serviceList.addService(serviceMock);
        await serviceList.stop();
        serviceMock.stopped.should.be.true;
    });
});
