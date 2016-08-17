'use strict';

class HandlerList {
	constructor(endpointList) {
		this.endpoints = endpointList;
	}
	add(method, path, handler) {
		this.endpoints.registerHandler(method, path, handler);
	}
}

module.exports = HandlerList;
