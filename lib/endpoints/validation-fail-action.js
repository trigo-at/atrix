'use strict';

module.exports = (request, h, err) => {
    const e = err;
    if (e.isJoi && e.isBoom && e.output.statusCode === 400 && e.details) {
        e.output.payload.details = e.details.map(d => {
            if (d.context.pattern && d.context.pattern instanceof RegExp) {
                const mapped = d;
                mapped.context.pattern = d.context.pattern.toString();
                return mapped;
            }

            return d;
        });
        throw e;
    }

    return h.response(e).takeover();
};
