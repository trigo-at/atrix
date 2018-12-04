'use strict';

const bb = require('bluebird');

module.exports = async (req, reply, service) => {
    ['debug', 'info', 'warn', 'error'].forEach(level => {
        service.log[level](`service.log.${level}`);
        req.log[level](`req.log.${level}`);
    });

    await bb.delay(50);
    reply(service.settings);
};
