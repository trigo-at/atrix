const atrix = require('..');

atrix.addService(require('./upstream-svc/service'));
atrix.addService(require('./downstream-svc/service'));
atrix.addService(require('./broken-upstream-svc/service'));
atrix.addService(require('./load-from-dir-svc/service'));
atrix.addService(require('./secured-svc/service'));
atrix.addService(require('./multi-secured-svc/service'));
atrix.addService(require('./test-svc/service'));
atrix.addService(require('./settings-svc/service'));
atrix.addService(require('./logger-svc/service'));
atrix.addService(require('./route-prefix/service'));

// console.log('start service...')
module.exports = Promise.all([
	atrix.services.upstream.start(),
	atrix.services.downstream.start(),
	atrix.services.brokenupstream.start(),
	atrix.services.loadFromDir.start(),
	atrix.services.secured.start(),
	atrix.services.multiSecured.start(),
	atrix.services.settings.start(),
	atrix.services.logger.start(),
	atrix.services.routeprefix.start(),
]);
