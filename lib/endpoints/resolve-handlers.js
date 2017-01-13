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
				(file.indexOf('GET.js') > -1 ||
					file.indexOf('PUT.js') > -1 ||
					file.indexOf('POST.js') > -1 ||
					file.indexOf('DELETE.js') > -1 ||
					file.indexOf('HEAD.js') > -1 ||
					file.indexOf('PATCH.js') > -1));

	const ret = [];

	const routeExists = (route, method) => R.find(R.allPass([R.propEq('path', route), R.propEq('method', method)]), ret);
	fileList.forEach((file) => {
		const module = require(file); // eslint-disable-line

		let routePath = file.replace(baseDir, '').replace('^', '/').replace(/GET|POST|HEAD|DELETE|PUT|OPTIONS|PATCH/, '').replace(/_\.js|\.js/, '');
		if (routePath !== '/' && routePath[routePath.length - 1] === '/') {
			routePath = routePath.substr(0, routePath.length - 1);
		}

		const method = file.match(/.*(GET|POST|HEAD|DELETE|PUT|OPTIONS|PATCH)|.js/)[1];
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

		ret.push({
			file: file,
			path: module.path || routePath,
			handler: typeof module === 'function' ? module : module.handler,
			method: module.method || method,
			config: module.config,
		});
	});

	service.log.debug(`Resolved handler list from ${baseDir}`, ret);
	return ret;
}

module.exports = resolveHandlers;
