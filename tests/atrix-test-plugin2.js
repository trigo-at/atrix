'use strict';

function register(a) {
    plugin.atrix = a; // eslint-disable-line
}

const plugin = {
    name: 'test-plugin2',
    version: '1.0.0',
    register,
    atrix: {},
    compatibility: {
        atrix: {
            min: '6.0.0-7',
        },
    },
};

module.exports = plugin;
