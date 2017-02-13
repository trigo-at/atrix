'use strict';

const atrix = require('../../');

atrix.addService(require('./service'));

atrix.services.loadFromDir.start();
