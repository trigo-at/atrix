'use strict'

const fs = require('fs');
const path = require('path');

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

function resolveHandlers(baseDir) {
	console.log(baseDir);
	const fileList = walk(baseDir)
        .filter(file => {
            return file.indexOf('index.js') === -1 &&
				(file.indexOf('GET.js') > -1 ||
					file.indexOf('PUT.js') > -1 ||
					file.indexOf('POST.js') > -1 ||
					file.indexOf('DELETE.js') > -1 ||
					file.indexOf('HEAD.js') > -1 ||
					file.indexOf('PATCH.js') > -1);
        });

	const ret = [];
	fileList.forEach(file => {
		console.log(file);
		let routePath = file.replace(baseDir, '').replace('^', '/').replace(/GET|POST|HEAD|DELETE|PUT|OPTIONS|PATCH/, '').replace(/_\.js|\.js/,'');
		if (routePath !== '/' && routePath[routePath.length -1] === '/') {
			routePath = routePath.substr(0, routePath.length -1);
		}
		const props = path.parse(file);
		console.log(props)

		const regex = new RegExp('.*(GET|POST|HEAD|DELETE|PUT|OPTIONS|PATCH)|.js');
		const match = file.match(/.*(GET|POST|HEAD|DELETE|PUT|OPTIONS|PATCH)|.js/);
		ret.push({
			path: routePath,
			module: require(file),
			method: match[1]
		});
	});

	console.log(ret);
	return ret;
}

module.exports = resolveHandlers;
