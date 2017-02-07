'use strict';

function mapResult(result) {
	const [response, responseBody] = result;
	let body = responseBody;
	try {
		if (response.status !== 204) {
			body = JSON.parse(responseBody.toString());
		}
	} catch (err) {
		body = responseBody.toString();
	}
	return {
		status: response.status,
		headers: response.responseHeaders,
		body,
	};
}

module.exports = mapResult;
