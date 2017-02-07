'use strict';

function respond(response) {
	if (response.status < 200 || response.status >= 400) {
		throw response;
	}

	return response;
}

module.exports = respond;
