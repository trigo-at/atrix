# atrix

[![Greenkeeper badge](https://badges.greenkeeper.io/trigo-at/atrix.svg?token=8175215e928f96258f2f2cf038f2649e81b29ea182f9babab6f45c7ccdc7d041)](https://greenkeeper.io/)
[![NSP Status](https://nodesecurity.io/orgs/trigo-gmbh/projects/6f4ad9d2-40fc-452b-8ae1-41433733d816/badge)](https://nodesecurity.io/orgs/trigo-gmbh/projects/6f4ad9d2-40fc-452b-8ae1-41433733d816)

## Description

Atrix is an opinionated micro-service framework

### Goals
* out-of the box default configuration
* minimum code required to implement features
* extendable using plugins (npm packages), currently available are
  * [atrix-mongoose](https://github.com/trigo-at/atrix-mongoose)
  * [atrix-orientdb](https://github.com/trigo-at/atrix-orentdb)
  * [atrix-mysql](https://github.com/trigo-at/atrix-mysql)
  * [atrix-acl](https://github.com/trigo-at/atrix-acl)
  * [atrix-soap](https://github.com/trigo-at/atrix-soap)
  * [atrix-elasticsearch](https://github.com/trigo-at/atrix-elasticsearch)
  * [atrix-swagger](https://github.com/trigo-at/atrix-swagger)
  * [atrix-pubsub](https://github.com/trigo-at/atrix-pubsub)

### Content
1. [Example Server setup](#example-server-setup)
1. [Handler Definition](#handler-definition)
1. [Cors](#cors)
1. [Request Logger](#request-logger)
1. [Logger](#logger)
1. [Settings](#settings)
1. [Upstream](#upstream)
1. [Overwriting config via env variables](#overwriting-config-via-env-variables)


# Example Server Setup

`/demoService/handlers/{id}_GET.js`
```js
module.exports = (req, reply, service) => {
	reply({ status: 'ok' });
}
```

`/demoService/config.js`
```js
module.exports = {
	endpoints: {
		http: {
			// declare port to bind
			port: 3007,

			// the directory containing the handler files
			handlerDir: `${__dirname}/handlers`,

			// determines which wilcard will be used for handler methods
			// e.g.: /info_GET.js could only be accessed with a GET request
			// /info_$.js could be accessed by following HTTP Methods (GET, POST, PATCH, PUT, OPTIONS, DELETE)
			handlerMethodWildcard: '$' // defaults to $

			// global server cors configuraton
			// see: https://hapijs.com/api#route-options rules apply here too
			cors: {
				// defaults to '*'
				origin: ['https://myui.myservice.at', 'http://lvh.me'],

				// allow additional headers to be sent when client XHR
				// lib is sending them like angular $http etc
				additionalHeaders: ['x-requested-with']
			},
			// request logger configuration
			requestLogger: {
				// enable the request logger
				enabled: false,

				// log full request body if content-type: application/javascript and multipart/form-data
				logFullRequest: true,

				// log full response if content-type: application/javascript
				logFullResponse: true,
			},
		},
	},
	// Add service settings in here. They are accessible in the handler as "service.settings" object
	settings: {
		test: 'value',
	},
};
```

`/index.js`
```js
'use strict';

// get  global atrix instance
const atrix = require('@trigo/atrix');

// load service config
const config = require('./demoService/config');

// crete service with config
const service = new atrix.Service('demoService', config);

// setup http service enpoint
service.endpoints.add('http');

// register service in atrix
atrix.addService(service);

// start the service
atrix.services.demoService.start(); // returns promise

```
# Handler definition

Declare a directory in which all handlers are saved, or add route handlers manually.

## Filename routes

### handlerDir
When using the `handlerDir` option the appropriate routes will be created based on the filenames and folder structure. The Caret symbol `^` is used as subroute indicator when using a single filename to represent a deep route. Route params can be defined by curly brackets e.g.: `{id}`

Special Characters:
* `_` the last underscore in the filename indicates the beginning of the http method to be used e.g.: `persons_GET.js`
*  `^` indicates the beginning of a subroute, e.g.: `persons^details_GET.js`
* Something in between curly braces indicates a route param e.g.: `persons^{id}_GET.js`;
* The method wildcard (`$` by default) can be used to open a route for all http methods `persons_$.js`

**Examples:**

* The file `/handlers/persons^{id}^details_GET.js` will create a route `GET /persons/{id}/details`.
* The File `/handlers/persons/{id}/details/GET.js` will created the same route.
* A Wildcard (by default `$`) can be used for the HTTP Method file ending. A file with the wildcard as method would be open for following HTTP Methods: `GET, PUT, POST, PATCH, OPTIONS, DELETE`

**Code Example:**
`/config.js`
```js
module.exports = {
	endpoints: {
		http: {
			port: 3000,
			// the directory containing the handler files
			handlerDir: `${__dirname}/handlers`,
		},
	},
};
```

`/handlers/persons_GET.js`
```js
module.exports = (req, reply, service) => {
	reply({status: 'ok'});
};
```
The route `GET /persons` will be available.

### Manually adding route handlers

As soon as the service has been created and an endpoint has been added, routes can be added manually.

```js
const atrix = require('@trigo/atrix');

const service = new atrix.Service('dummyService', {
	endpoints: {
		http: {
			port: 3000,
		},
	},
});

service.endpoints.add('http');

// service.handlers.add(httpMethod, route, handler);
service.handlers.add('GET', '/persons/{id}/details', (req, reply, service) => {
	reply({status: 'ok'});
});

service.start();
```

# Cors

`/config.js`
```js
module.exports = {
	endpoints: {
		http: {
			port: 3000,

			// global server cors configuraton
			// see: https://hapijs.com/api#route-options rules apply here too
			cors: {
				// defaults to '*'
				origin: ['https://myui.myservice.at', 'http://lvh.me'],

				// allow additional headers to be sent when client XHR
				// lib is sending them like angular $http etc
				additionalHeaders: ['x-requested-with']
			},
		},
	},
};
```

# Request Logger

`/config.js`
```js
module.exports = {
	endpoints: {
		http: {
			port: 3000,

			// request logger configuration
			requestLogger: {
				// enable the request logger
				enabled: false,

				// log full request body if content-type: application/javascript and multipart/form-data
				logFullRequest: true,

				// log full response if content-type: application/javascript
				logFullResponse: true,
			},
		},
	},
};
```

# Logger
WIP
```js
module.exports = {
	logger: {

	}
}
```

# Settings

Add service settings in here. They are accessible in the handler as "service.settings" object

`/config.js`
```js
module.exports = {
	settings: {
		pika: 'chu',
	},
};
```

Under the assumption the service is called `demoService`. You could access your settings like this:

```js
const atrix = ('@trigo/atrix');
const service = atrix.services.demoService;

const pikaValue = service.settings.pika;
```

Or in every service handler

```js
module.exports = (req, res, service) => {
	req.log.info(`Value of Pika is ${service.settings.pika}`);
}
```



# Upstream

## Basic Upstream

## Retry

## Authentication

### Basic

### OAuth

# Overwriting config via env variables

Every in the `config` defined variables can be overwritten by environment variables. They have to follow a strict pattern. The enviroment variable has to be defined in Uppercase-Snakecase. Starting with `ATRIX` followed by the atrix services name which is defined by the `new atrix.Service('demoService', config)` call. For the `demoService` we would have to start with `ATRIX_DEMOSERVICE_` as environment variable name.

e.g.:
`/config.js`
```js
module.exports = {
	settings: {
		nestedSetting: {
			pika: 'chu',
		},
	},
};
```

To overwrite the value of pika we would have to define the env variable like that:
```
ATRIX_DEMOSERVICE_SETTINGS_NESTEDSETTING_PIKA=chuchu
```
