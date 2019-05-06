'use strict';

function register(a) {
    plugin.atrix = a; // eslint-disable-line
}

const plugin = {
    name: 'test-plugin-compatibility-min-v100',
    version: '1.0.0',
    register,
    atrix: {},
    compatibility: {
        atrix: {min: '100.0.0'},
    },
};

module.exports = plugin;
