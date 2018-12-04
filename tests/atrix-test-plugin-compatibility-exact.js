'use strict';

const {version} = require('../package.json');

function register(a) {
    plugin.atrix = a; // eslint-disable-line
}

const plugin = {
    name: 'test-plugin-compatibility-exact',
    version: '1.0.0',
    register,
    atrix: {},
    compatibility: {
        atrix: {
            min: version,
            max: version,
        },
    },
};

module.exports = plugin;
