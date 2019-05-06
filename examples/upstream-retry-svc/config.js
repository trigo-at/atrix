module.exports = {
    name: 'upstreamretry',
    endpoints: {
        http: {
            port: 3006,
        },
    },
    upstream: {
        retrydemo: {
            url: 'http://some.url',
            retry: {
                max_tries: 3,
                interval: 500,
            },
        },
    },
};
