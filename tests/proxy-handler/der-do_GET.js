'use strict';

module.exports = {
    path: '/da-ondare',
    proxy: {
        mapUri: () => {
            return { uri: 'http://www.google.com' }
        },
    },
};
