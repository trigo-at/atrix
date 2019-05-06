'use strict';

function register(a) {
    plugin.atrix = a; // eslint-disable-line
}

const plugin = {
    name: 'test-plugin-compatibilty-no-atrix',
    version: '1.0.0',
    register,
    atrix: {},
    compatibility: {},
};

module.exports = plugin;
