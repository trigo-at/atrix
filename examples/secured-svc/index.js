'use strict';
const atrix = require('../../');

atrix.addService(require('./service'));

atrix.services.secured.start();
