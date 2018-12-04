'use strict';

function register(a) {
    plugin.atrix = a; // eslint-disable-line
}

const plugin = {
    name: 'test-plugin-no-compatibilty',
    version: '1.0.0',
    register,
    atrix: {},
};

module.exports = plugin;
