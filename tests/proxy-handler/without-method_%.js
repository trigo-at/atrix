'use strict';

module.exports = {
    proxy: {
        mapUri: () => {
            return { uri: 'https://httpbun.org/anything' }
        },
    },
};
