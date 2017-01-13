'use strict';
const atrix = require('@trigo/atrix');

atrix.addService(require('./upstream-svc/service'));
atrix.addService(require('./downstream-svc/service'));
atrix.addService(require('./broken-upstream-svc/service'));
atrix.addService(require('./load-from-dir-svc/service'));
atrix.addService(require('./secured-svc/service'));

console.log('start service...')
module.exports = Promise.all([
	atrix.services.upstream.start(),
	atrix.services.downstream.start(),
	atrix.services.brokenupstream.start(),
	atrix.services.loadFromDir.start(),
	atrix.services.secured.start(),
]);
