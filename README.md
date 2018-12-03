# atrix

[![NSP Status](https://nodesecurity.io/orgs/trigo-gmbh/projects/6f4ad9d2-40fc-452b-8ae1-41433733d816/badge)](https://nodesecurity.io/orgs/trigo-gmbh/projects/6f4ad9d2-40fc-452b-8ae1-41433733d816)

## Description

Atrix is an opinionated micro-service framework

### Goals
* Out-of the box default configuration on initial pull
* Minimum code required to implement features
* Extendable using plugins (npm packages). Currently available are:
  * [atrix-mongoose](https://github.com/trigo-at/atrix-mongoose)
  * [atrix-orientdb](https://github.com/trigo-at/atrix-orentdb)
  * [atrix-mysql](https://github.com/trigo-at/atrix-mysql)
  * [atrix-acl](https://github.com/trigo-at/atrix-acl)
  * [atrix-soap](https://github.com/trigo-at/atrix-soap)
  * [atrix-elasticsearch](https://github.com/trigo-at/atrix-elasticsearch)
  * [atrix-swagger](https://github.com/trigo-at/atrix-swagger)
  * [atrix-pubsub](https://github.com/trigo-at/atrix-pubsub)

### Content
* [Example Server setup](#example-server-setup)
* [Handler Definition](#handler-definition)
* [CORS](#cors)
* [Request Logger](#request-logger)
* [Logger](#logger)
* [Settings](#settings)
* [Upstream](#upstream)
  * [Basic Upstream](#basic-upstream)
  * [Options](#options)
  * [Retry](#retry)
  * [Authentication](#upstream-authentication)
  * [Basic Authentication](#basic-authentication)
  * [OAuth Authentication](#oauth-authentication)
* [Overwriting config via env variables](#overwriting-config-via-env-variables)

# ChangeLog

## 5.x -> 6.x

# changes paramters of atrix.addService(), mandatory config property "name"

Parameters have changed form `addService(service: Service)` to `addService(config: object)`

The service instance is the instantiated internaly and automatically added to the atrix service container. As a consequence the `config` object must define a non-empty `name` property.
Exapmle:
```
// v5
const svc = new atrix.Service('serviceName', { endpoints: ..., settings: ...});
artrix.addService(svc);

// v6
const svc = atrix.addService({ name: 'serviceName', endpoints: ..., settings:...})

````
> In the examples below, several `/config.js` files are cited. In a single project, you may have more than one config file, however, _only one config file is used to create a service._

___

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
	// name of the service (REQUIRED)
	name: 'demoService',
	endpoints: {
		http: {
			// declare port to bind
			port: 3007,

			// the directory containing the handler files
			handlerDir: `${__dirname}/handlers`,

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
const service = atrix.addService(config);

// start the service
atrix.services.demoService.start(); // returns promise

```
# Handler definition

Declare a directory in which all handlers are contained, or add route handlers manually.

## Filename routes

### handlerDir
When using the `handlerDir` option the appropriate routes will be created based on the filenames and folder structure. The Caret symbol `^` is used as subroute indicator when using a single filename to represent a deep route. Route params can be defined by curly brackets e.g.: `{id}`

**Special Characters:**
* `_` the last underscore in the filename indicates the beginning of the http method to be used e.g.: `persons_GET.js`
*  `^` indicates the beginning of a subroute, e.g.: `persons^details_GET.js`
* Something in between curly braces indicates a route param e.g.: `persons^{id}_GET.js`;
* The method wildcard character (`%` by default) can be used to create a route for all http methods `persons_%.js`

**Examples:**

* The file `/handlers/persons^{id}^details_GET.js` will create a route `GET /persons/{id}/details`.
* The file `/handlers/persons/{id}/details/GET.js` will create the same route.
* A wildcard character (by default `%`) can be used for the HTTP method file ending. A file with a wildcard character as a method would be open for following the HTTP methods: `GET, PUT, POST, PATCH, OPTIONS, DELETE`

**Code Example:**

`/config.js`
```js
module.exports = {
	name: 'dummyService', // mandatory property
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
The route `GET /persons` is made available by the above examples.

### Manually adding route handlers

Once a service has been created and an endpoint has been added, routes can be added manually.

```js
const atrix = require('@trigo/atrix');

const service = atrix.addService({
	name: 'dummyService', 
	endpoints: {
		http: {
			port: 3000,
		},
	},
});

// service.handlers.add(httpMethod, route, handler);
service.handlers.add('GET', '/persons/{id}/details', (req, reply, service) => {
	reply({status: 'ok'});
});

service.start();
```

# CORS

`/config.js`
```js
module.exports = {
	name: 'serviceName',
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
	name: 'serviceName',
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

The atrix logger uses bunyan under the hood. For more info about bunyan streams have a look at the [bunyan stream documentation](https://github.com/trentm/node-bunyan#streams).

`/config.js`
```js
module.exports = {
	name: 'serviceName',
	logger: {
		level: 'debug',
		name: 'dummyDebugger', // optional, atrix would insert the services name if no logger name is provided
		streams: [], // optional, bunyan streams
	}
}
```

The logger can be accessed on the request object in every service handler.

`/simple_GET.js`
```js
module.exports = (req, reply) => {
	req.log.debug('I am a debug message');
	req.log.info('I am an info message');
	req.log.warn('I am a warning message');
	req.log.info('I am a error message');
	reply({status: 'ok'});
};
```

Optionally, you can also access the logger of your service as it is exposed via atrix:

`/service.js`
```js
const atrix = require('@trigo/atrix');

const service = atrix.addService({.name: 'dummyService', ...service configuration...});

// access directly using service instance
service.log.info('I am the dummyService logger');

// access through atrix 
atrix.service.dummyService.log.info('I am also the dummyService logger');

```

# Settings

Add service settings in here. They are accessible in the handler as the  "service.settings" object

`/config.js`
```js
module.exports = {
	settings: {
		pika: 'chu',
	},
};
```

For example, if the service were to be called `demoService`, you could access its settings like this:

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

Atrix uses [axios](https://github.com/axios/axios) for HTTP requests and can be configured for multiple upstreams. Upstreams will expose a simple interface to make preconfigured HTTP requests.

## Basic Upstream

**Example of a basic upstream configuration** `/config.js`
```js
module.exports = {
	upstream: {
		example: {
			url: 'http://some.url',
		},
	},
};
```

The defined upstream can be accessed in every service handler via the service parameter.

**Example usage of upstream directly inside a service handler** `/simple_GET.js`
```js
module.exports = async (req, reply, service) => {
	const result = await service.upstream.example.get('/');
	req.log.info(result);
	reply({status: 'ok'});
};
```

Alternativ the upstreams can be accessed via the exposed service from atrix.

**Example usage of upstream inside a module which is called from within the dummyService** `/some_file/which_is/part_of/the_service`
```js
const atrix = require('@trigo/atrix');
// here we assume the service has been named 'dummyService'
const service = atrix.dummyService;
const exampleUpstream = service.upstream.example;
```

## Options

You can define options (e.g.: headers) which will be merged into the underlying fetch request.

**Example configuration for upstream headers** `/config.js`
```js
module.exports = {
	upstream: {
		example: {
			url: 'http://some.url',
			options: {
				headers: {
					'User-Agent': 'ATRIX_SERVICE',
				},
			},
		},
	},
};
```

## Retry

Upstreams can be configured to automatically retry the requests in case of an error for several times with a defined interval.

**Example configuration for retry upstream** `/config.js`
```js
module.exports = {
	upstream: {
		example: {
			url: 'http://some.url',
			retry: {
				interval: 1000, // milliseconds
				max_tries: 3,
			},
		},
	},
};
```

## Upstream Authentication

You can set up basic authentication or oAuth authentication which will be handled by the upstream itself.

### Basic Authentication

**Example configuration for a basic authentication upstream** `/config.js`
```js
module.exports = {
	upstream: {
		example: {
			url: 'http://some.url',
			security: {
				strategies: {
					basic: {
						username: 'username',
						password: 'password',
					},
				},
			},
		},
	},
};
```

### OAuth Authentication

The OAuth strategy will try to authenticate against the provided `authEndpoint` and `grantType` via Basic authentication. The auth endpoint has to return a JSON answer contiaining an `access_token`.

```js
// json answer e.g.:
{
	access_token: '123456'
}
```

After the initial configuration it is not necessary to authenticate manually - upstream will handle the authentication process on the first request and will cache the returning `access_token` for further requests.

**Example configuration for a oauth authentication upstram** `/config.js`
```js
module.exports = {
	upstream: {
		example: {
			url: 'http://some.url',
			security: {
				strategies: {
					oauth: {
						clientId: 'client_id',
						clientSecret: 'client_secret',
						authEndpoint: 'http://auth.endpoint/token',
						grantType: 'password',
					},
				},
			},
		},
	},
};
```

# Overwriting config via env variables

Every variable defined in the `/config.js` can be overwritten by declaring environment variables. Configurations that are not already defined in `/config.js` **may not** be declared by environment variables - _especially arrays_ - you may not insert additional items to arrays...

They have to follow a strict pattern. The environment variable has to be defined in snakecased uppercased words eg. `THIS_IS_AN_ENV_VAR`. Starting with `ATRIX`, followed by the atrix service's name, which is defined by the `new atrix.Service('demoService', config)` call. For the `demoService` we would have to start with `ATRIX_DEMOSERVICE_` as environment variable name.

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

