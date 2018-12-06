'use strict';

const fs = require('fs');
const R = require('ramda');
const symbols = require('../symbols');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const newFile = `${dir}/${file}`;
        const stat = fs.statSync(newFile);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(newFile));
        } else {
            results.push(newFile);
        }
    });
    return results;
}

function resolveHandlers(baseDir, service) {
    const methodWildcard = '%';
    const escapedNeedCharacters = '[/\\^$.|?*+()';
    const escapeWildcard = escapedNeedCharacters.indexOf(methodWildcard) >= 0;
    const regexWildcard = escapeWildcard ? `\\${methodWildcard}` : methodWildcard;

    const isValidHandlerRegex = new RegExp(`.*(GET|POST|HEAD|DELETE|PUT|OPTIONS|PATCH|${regexWildcard}).js$`);
    const fileList = walk(baseDir).filter(file => file.indexOf('index.js') === -1 && file.match(isValidHandlerRegex));
    const resolvedRoutes = [];

    const routeExists = (route, method) =>
        R.find(R.allPass([R.propEq('path', route), R.propEq('method', method)]), resolvedRoutes);
    const routePathReplaceRegex = new RegExp(
        `GET\\.js$|POST\\.js$|HEAD\\.js$|DELETE\\.js$|PUT\\.js$|OPTIONS\\.js$|PATCH\\.js$|${regexWildcard}\\.js$`
    );
    const matchMethodsRegex = new RegExp(`.*(GET|POST|HEAD|DELETE|PUT|OPTIONS|PATCH|${regexWildcard})\\.js$`);
    fileList.forEach(file => {
        const module = require(file); // eslint-disable-line

        let routePath = file
            .replace(baseDir, '')
            .replace(/\^/g, '/')
            .replace(routePathReplaceRegex, '')
            .replace(/_$/, '');
        if (routePath !== '/' && routePath[routePath.length - 1] === '/') {
            routePath = routePath.substr(0, routePath.length - 1);
        }

        let method = file.match(matchMethodsRegex)[1];
        if (method === methodWildcard) {
            method = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT'];
        }

        const existing = routeExists(routePath, method);
        if (existing) {
            const msg = `Route conflict: ${existing.method} ${existing.path} defined by: ${file} conflicts with: ${
                existing.file
            }`;
            throw new Error(msg);
        }

        if (module.path && module.path !== routePath) {
            service.log.warn(`Overriding handler path from module: ${file}`);
        }
        if (module.method && module.method !== routePath) {
            service.log.warn(`Overriding handler method from module: ${file}`);
        }

        // allow disabling of the route on all three common used places: module.exports, module.exports.handler, module.exports.proxy
        if (module === symbols.DISABLED || module.handler === symbols.DISABLED || module.proxy === symbols.DISABLED)
            return;

        let handler;
        if (typeof module === 'function') {
            handler = module;
        } else if (typeof module.handler === 'function') {
            handler = module.handler;
        } else if (typeof module === 'object' && typeof module.proxy === 'object') {
            handler = module;
        }

        resolvedRoutes.push({
            file,
            path: module.path || routePath,
            handler,
            method: module.method || method,
            options: module.options || module.config,
        });
    });

    service.log.debug(`Resolved handler list from ${baseDir}`, resolvedRoutes, null, 2);
    return resolvedRoutes;
}

module.exports = resolveHandlers;
