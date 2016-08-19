'use strict';
const atrix = require('atrix');
const accountingSvc = require('./accounting/service');
const reportingSvc = require('./reporting/service');

accountingSvc.start();
reportingSvc.start();
