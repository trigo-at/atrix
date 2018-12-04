const atrix = require('..');

require('./upstream-svc/service');
require('./downstream-svc/service');
require('./broken-upstream-svc/service');
require('./load-from-dir-svc/service');
require('./secured-svc/service');
require('./multi-secured-svc/service');
require('./test-svc/service');
require('./settings-svc/service');
require('./logger-svc/service');
require('./route-prefix/service');

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
