# Change Log

## v6.x => 7.x

### Breaking Changes

* Removed signed link auth

## v5.x -> v6.0.0

### Breaking Changes

#### Upgrade to Hapi 17

Atrix uses [Hapi](http://hapijs.com) under the hood for serving HTTP based services. As Hapi 17 was a major rewrite of the framwork and contained several breaking changes, this is metioned here explicitly.

Although atrix provides abstractions for lot of the hapi specific stuff, expecially the rather complex route configurations & myriads of plugins and options several interfaces are directly used in atrix service handlers.

`my-entity/POST.js`
```
module.exports = async (
	// plain hapi request object (see: https://hapijs.com/api#request)
    req, 
    // a wrapped hapi response toolkit (see: https://hapijs.com/api#response-toolkit)
    // simple compatibility layer to provide a interface similar to the reply interface
    // as provided by hapi v16 and before. e.g reply(result).code(201) instead of
    // h.response(result).code(201)
    reply, 
    // the atrix service object
    service) => {
	...
}
```

For a complete list of what changed under the hood have a look at the official hapi 17 release notes [https://github.com/hapijs/hapi/issues/3658](https://github.com/hapijs/hapi/issues/3658)

#### `reply(<value>)` no longer supports promises

When using `reply(<value>)` value **MUST NOT** be a promise. Simply `await` the value before calling `reply()` e.g.

```
// Atrix v5
const result = getFromDb();
reply(result).code(201)

// Atrix v6
const result = await getFromDb();
reply(result).code(201);

// use response toolkit methods (see: https://hapijs.com/api#response-toolkit)
const result = await getFromDb();
return reply.response(result).code(201)

// directly return value from handler -> fefaults to statusCode 200
const result = await getFromDb();
return result;

```

#### changes paramters of atrix.addService(), mandatory config property "name"

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

#### Removed API: service.endpoints.add(endpointName: string)

All endpoints declared in the `config.endpoints` section are now loaded by default unless it has been explizitly disabled with `enabled => false` setting.
Method now throw an error with a message that API has been removed. So migrate your serviecs simply remove all calls to this method. 

### Improvements

* Print out service configuration on startup
*  Print out loaded plugins on startup

## v4.x -> v5.0.0

### Breaking changes

#### upstream oauth strategy properties renamed from snake_case to camelCase.
 - `client_id` to `clientId`
 - `client_secret` to `clientSecret`
 - `auth_endpoint` to `authEndpoint`
 - `grant_type` to `grantType`

**Be aware**: this won't affect any pathfinder repositories because upstream authorization is *NOT* used by them.

- replaced `fetch` with `axios` as the underlying package used for upstream, keeping compatibility with earlier versions
- removed package `btoa` because it is no longer needed
