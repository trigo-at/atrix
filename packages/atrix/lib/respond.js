'use strict';

function respond(response) {
	if (response.status < 200 || response.status >= 300) {
		throw response;
	} else {
		return response;
	}
}

module.exports = respond;
