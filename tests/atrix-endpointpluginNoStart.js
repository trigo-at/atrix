module.exports = {
    name: 'artix-endpointplugin',
    version: '1.0.0',
    register: () => {},
    atrix: {},
    factory: () => {
        return {
            stop: () => {},
            registerHandler: () => {},
        };
    },
    compatibility: {
        atrix: {
            min: '6.0.0-7',
        },
    },
};
