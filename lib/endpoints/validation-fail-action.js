'use strict';

module.exports = (request, h, err) => {
    const e = err;
    if (e.isJoi && e.isBoom && e.output.statusCode === 400 && e.details) {
        e.output.payload.details = e.details;
        throw e;
    }

    return h.response(e).takeover();
};
