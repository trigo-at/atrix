'use strict';

module.exports = (req, reply, service) => {
    reply(service.settings);
};
