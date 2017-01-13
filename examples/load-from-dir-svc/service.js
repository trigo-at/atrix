'use strict';
const atrix = require('@trigo/atrix');

var service = new atrix.Service('loadFromDir', require('./config'));

service.endpoints.add('http');

module.exports = service;
