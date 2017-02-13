'use strict';

const atrix = require('../..');
const config = require('./config');

const service = new atrix.Service('test', config);

service.endpoints.add('http');

module.exports = service;