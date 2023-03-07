'use strict';

module.exports = {
    proxy: {
        mapUri: () => {
            return { uri: 'http://eu.httpbin.org/anything' }
        },
    },
};
