'use strict';

const debug = require('debug')('@trigo/atrix:hapi-request-logger');

const asJSONOrUndefined = val => {
    if (!val) {
        return undefined;
    }
    try {
        return JSON.stringify(val, null, 2);
    } catch (e) {
        return e.toString();
    }
};

const parseRequest = (request, opts) => {
    const reqData = {
        headers: asJSONOrUndefined(request.headers),
        params: asJSONOrUndefined(request.params),
        query: asJSONOrUndefined(request.query),
    };

    if (opts.logFullRequest && request.headers && request.headers['content-type']) {
        if (request.headers['content-type'].match(/application\/json/)) {
            reqData.json = asJSONOrUndefined(request.payload);
        } else if (
            request.headers['content-type'].match(/multmultipart\/form-datart\/form-dataipart\/form-data/) &&
            request.payload
        ) {
            //eslint-disable-line
            reqData.json = {};
            Object.keys(request.payload).forEach(key => {
                const val = request.payload[key];
                if (typeof val !== 'object') {
                    reqData.json[key] = val;
                } else {
                    reqData.json[key] = '<BINARY OBJECT DATA>';
                }
            });
        }
    }

    return reqData;
};

const register = async (server, options) => {
    const MATCH_PATH_CACHE = {};
    const opts = Object.assign({ logFullResponse: false, logFullRequest: false, ignoreEndpoints: [] }, options);
    debug('Effective hapi-request-logger options', opts);

    const shouldLogPath = path => {
        if (MATCH_PATH_CACHE[path] === undefined) {
            const endpointPattern = opts.ignoreEndpoints.map(x => new RegExp(x));
            MATCH_PATH_CACHE[path] = !endpointPattern.some(x => path.match(x));
            debug(`evaluated & cache whether to log path: ${path} => ${MATCH_PATH_CACHE[path]}`);
        }
        return MATCH_PATH_CACHE[path];
    };

    server.events.on('response', request => {
        console.log(request.path)

        const msec = Date.now() - request.info.received;

        if (!shouldLogPath(request.path, opts, MATCH_PATH_CACHE)) return;

        const response = {};
        if (request.response) {
            response.headers = asJSONOrUndefined(request.response.headers);
        }

        if (
            opts.logFullResponse &&
            request.response &&
            request.response.headers &&
            request.response.headers['content-type'] &&
            request.response.headers['content-type'].match(/application\/json/)
        ) {
            response.json = asJSONOrUndefined(request.response.source);
        }

        request.log(['http-request'], {
            remoteAddress: request.info.remoteAddress,
            method: request.method.toLowerCase(),
            path: request.path,
            statusCode: request.response && request.response.statusCode,
            msec,
            response,
            request: parseRequest(request, opts),
        });
    });
};

register.attributes = {
    description:
        'Writes one log mesage with all relevant request/response information to the confgured log using the http-request tag',
};

module.exports = {
    register,
    name: 'HapiRequestLogger',
};
