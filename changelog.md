### v5.0.0
- BREAKING: upstream oauth strategy properties renamed from snake_case to camelCase.
 - `client_id` to `clientId`
 - `client_secret` to `clientSecret`
 - `auth_endpoint` to `authEndpoint`
 - `grant_type` to `grantType`

**Be aware**: this won't affect any pathfinder repositories because upstream authorization is *NOT* used by them.

- replaced `fetch` with `axios` as the underlying package used for upstream, keeping compatibility with earlier versions
- removed package `btoa` because it is no longer needed
