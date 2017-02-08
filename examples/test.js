'use strict';
const atrix = require('..');

atrix.addService(require('./test-svc/service'));

module.exports = Promise.all([
	atrix.services.test.start(),
]);
