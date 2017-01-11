
'use strict';

const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

function logEvent(ctx, data, request) {
    console.log(ctx, data, request)
    if (!data) {
        return;
    }

    let obj = {};
    let msg = '';

    if (ctx.includeTags && Array.isArray(data.tags)) {
        obj.tags = ctx.joinTags ? data.tags.join(ctx.joinTags) : data.tags;
    }

    if (request) {
        obj.req_id = request.id;
    }

    if (data instanceof Error) {
        ctx.log.child(obj)[ctx.level](data);
        return;
    }

    const type = typeof data.data;

    if (type === 'string') {
        msg = data.data;
    } else if (ctx.includeData && data.data !== undefined) {
        if (ctx.mergeData && type === 'object' && !Array.isArray(data.data)) {
            obj = Object.assign(obj, data.data);

            if (obj.id === obj.reqId) {
                delete obj.id;
            }
        } else {
            obj.data = data.data;
        }
    } else if (ctx.skipUndefined) {
        return;
    }

    ctx.log[ctx.level](obj, msg);
}

function register(server, options, next) {
    if (!options.logger) {
        return next(new Error('logger required'));
    }

    const log = options.logger;
    const handler = options.handler || function f() {};

    const theOptions = Object.assign({
        includeTags: false,
        includeData: true,
        mergeData: false,
        skipUndefined: true,
    }, options);

    delete theOptions.logger;
    delete theOptions.handler;

    const makeCtx = function f(tags, level) {
        let myLevel = level;
        if (tags.fatal) {
            myLevel = 'fatal';
        } else if (tags.error) {
            myLevel = 'error';
        } else if (tags.warn) {
            myLevel = 'warn';
        } else if (tags.info) {
            myLevel = 'info';
        } else if (tags.debug) {
            myLevel = 'debug';
        } else if (tags.trace) {
            myLevel = 'trace';
        }

        return {
            level: myLevel,
            log,
            includeTags: theOptions.includeTags,
            includeData: theOptions.includeData,
            mergeData: theOptions.mergeData,
            skipUndefined: theOptions.skipUndefined,
            joinTags: theOptions.joinTags,
        };
    };

    server.ext('onRequest', (request, reply) => {
        const rlog = request.log;

        const opts = { // eslint-disable-line
            req_id: request.id // eslint-disable-line
        };

        request.bunyan = log.child(opts);
        request.log = function logf() { // eslint-disable-line no-param-reassign
            rlog.apply(request, arguments); // eslint-disable-line prefer-rest-params
        };

        LEVELS.forEach(level => {
            request.log[level] = function logLevel() { // eslint-disable-line
                request.bunyan[level].apply(request.bunyan, arguments); // eslint-disable-line prefer-rest-params
            };
        });

        request.log.child = request.bunyan.child.bind(request.bunyan);
        return reply.continue();
    });

    server.on('log', (data, tags) => {
        const ctx = makeCtx(tags, 'info');

        if (handler.call(ctx, 'log', data, tags)) {
            return;
        }

        logEvent(ctx, data);
    });

    server.on('request', (request, data, tags) => {
        const ctx = makeCtx(tags, 'info');

        if (handler.call(ctx, 'request', request, data, tags)) {
            return;
        }

        logEvent(ctx, data, request);
    });

    server.on('request-error', (request, err) => {
        const tags = {};
        const ctx = makeCtx(tags, 'error');

        if (handler.call(ctx, 'request-error', request, err, tags)) {
            return;
        }

        logEvent(ctx, err, request);
    });

    next();
    return null;
}

register.attributes = {
    description: 'Integrate bunyan as logger in Hapi',
    name: 'HapiBunyan',
};

exports.log = logEvent;
exports.register = register;
