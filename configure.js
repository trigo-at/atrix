'use strict';

module.exports = configObj => {
    const atrixConfig = configObj;
    return cfg => {
        Object.keys(cfg).forEach(key => {
            atrixConfig[key] = cfg[key];
        });
    };
};
