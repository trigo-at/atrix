module.exports = {
    name: 'artix-endpointplugin',
    version: '1.0.0',
    register: () => {},
    atrix: {},
    factory: () => {
        return {
            start: () => {},
        };
    },
    compatibility: {
        atrix: {
            min: '6.0.0-7',
        },
    },
};
