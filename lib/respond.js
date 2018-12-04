'use strict';

function respond(response) {
    if (response.status < 200 || response.status >= 500) {
        throw response;
    }

    return response;
}

module.exports = respond;
