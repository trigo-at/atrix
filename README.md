# atrix

[![Greenkeeper badge](https://badges.greenkeeper.io/trigo-at/atrix.svg?token=8175215e928f96258f2f2cf038f2649e81b29ea182f9babab6f45c7ccdc7d041)](https://greenkeeper.io/)

[![NSP Status](https://nodesecurity.io/orgs/trigo/projects/3bebb03f-c012-47dc-9e21-25ca9f05395b/badge)](https://nodesecurity.io/orgs/trigo/projects/3bebb03f-c012-47dc-9e21-25ca9f05395b)

## Description

Atrix is a opinionated micro-service famwork

### Goals
* out-of the box default configuration
* minimum code required to implement features
* extendable using plugins (npm packages)

# Example Server Setup

```
// load-from-dir-svc/handlers/{id}_GET.js
module.exports = (req, reply, service) => {
	reply({ status: 'ok' });	
}

// load-from-dir-svc/config.js
module.exports = {
	endpoints: {
		http: {
			// declare port to bind
			port: 3007,
			
			// the directory containing the handler files
			handlerDir: `${__dirname}/handlers`,
		},
	},
};

// index.js
'use strict';

// get  global atrix instance
const atrix = require('@trigo/atrix');

// load service config
const config = require('./load-from-dir-svc/config');

// crete service with config
const service = new atrix.Service('loadFromDir', config);

// setup http service enpoint
service.endpoints.add('http');

// register service in atrix
atrix.addService(service);

// start the service
atrix.loadFromDir.start(); // returns promise

```
