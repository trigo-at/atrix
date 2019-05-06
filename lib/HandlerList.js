'use strict';

class HandlerList {
    constructor(endpointList) {
        this.endpoints = endpointList;
    }
    add(method, path, handler, config) {
        this.endpoints.registerHandler(method, path, handler, config);
    }
}

module.exports = HandlerList;
