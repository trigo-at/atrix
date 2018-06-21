'use strict';

module.exports = async (req, reply, service) => {
	const res = await service.request({
		url: '/',
	});
	reply(res.result);
};
