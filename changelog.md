# Change Log

## v5.x -> v6.0.0

### Breaking Changes

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
