'use strict';

module.exports = {
    name: 'multiSecured',
    endpoints: {
        http: {
            port: 3018,
            cors: true,
            requestLogger: {
                enabled: true,
            },
        },
    },
    security: {
        strategies: {
            jwt: {
                secret: 'changeme',
                algorithm: 'HS256',
            },
            signedlink: {
                secret: 'test-secret',
            },
        },
        endpoints: {
            jwt: ['/jwt.*'],
            signedlink: ['/signedlink.*'],
        },
    },
};
