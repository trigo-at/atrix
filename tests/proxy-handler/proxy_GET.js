'use strict';

module.exports = {
    proxy: {
        mapUri: () => {
            return { uri: 'http://www.google.com' };
        },
    },
};
