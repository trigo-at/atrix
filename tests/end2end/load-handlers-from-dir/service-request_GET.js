'use strict';

module.exports = async (req, reply, service) => {
    const postResult = await service.request({
        method: 'post',
        url: '/42',
    });

    reply(postResult);
};
