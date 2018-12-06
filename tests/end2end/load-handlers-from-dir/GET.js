'use strict';

module.exports = (req, reply, service) => {
    return reply({res: 'GET /', serviceName: service.name}).code(201);
};
