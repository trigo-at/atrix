'use strict';

const fs = require('fs');
const R = require('ramda');

function walk(dir) {
	let results = [];
	const list = fs.readdirSync(dir);
	list.forEach((file) => {
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
	const fileList = walk(baseDir)
		.filter(file => file.indexOf('index.js') === -1 &&
			file.match(/.*(GET|POST|HEAD|DELETE|PUT|OPTIONS|PATCH|\*).js$/));

	const ret = [];

	const routeExists = (route, method) => R.find(R.allPass([R.propEq('path', route), R.propEq('method', method)]), ret);
	fileList.forEach((file) => {
		const module = require(file); // eslint-disable-line

		let routePath = file.replace(baseDir, '').replace(/\^/g, '/')
			.replace(/GET\.js$|POST\.js$|HEAD\.js$|DELETE\.js$|PUT\.js$|OPTIONS\.js$|PATCH\.js$|\*\.js$/, '').replace(/_$/, '');
		if (routePath !== '/' && routePath[routePath.length - 1] === '/') {
			routePath = routePath.substr(0, routePath.length - 1);
		}

		let method = file.match(/.*(GET|POST|HEAD|DELETE|PUT|OPTIONS|PATCH|\*)\.js$/)[1];
		if (method === '*') {
			method = [
				'DELETE',
				'GET',
				'OPTIONS',
				'PATCH',
				'POST',
				'PUT',
			];
		}

		const existing = routeExists(routePath, method);
		if (existing) {
			const msg = `Route conflict: ${existing.method} ${existing.path} defined by: ${file} conflicts with: ${existing.file}`;
			throw new Error(msg);
		}

		if (module.path && module.path !== routePath) {
			service.log.warn(`Overriding handler path from module: ${file}`);
		}
		if (module.method && module.method !== routePath) {
			service.log.warn(`Overriding handler method from module: ${file}`);
		}


		let handler;
		if (typeof module === 'function') {
			handler = module;
		} else if (typeof module.handler === 'function') {
			handler = module.handler;
		} else if (typeof module === 'object' && typeof module.proxy === 'object') {
			handler = module;
		}

		ret.push({
			file,
			path: module.path || routePath,
			handler,
			method: module.method || method,
			config: module.config,
		});
	});

	service.log.debug(`Resolved handler list from ${baseDir}`, JSON.stringify(ret, null, 2));
	return ret;
}

module.exports = resolveHandlers;
