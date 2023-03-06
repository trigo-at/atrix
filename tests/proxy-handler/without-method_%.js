'use strict';

module.exports = {
    proxy: {
        mapUri: () => {
            console.log('MAP')
            return { uri: 'http://eu.httpbin.org/anything' }
        },
    },
};
