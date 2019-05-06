'use strict';

const {clone, lensPath, set, omit, merge, pick, map, view} = require('ramda');

function getKeys(obj, prefix) {
    const keys = Object.keys(obj);
    prefix = prefix ? `${prefix}.` : ''; // eslint-disable-line no-param-reassign
    return keys.reduce((result, key) => {
        if (typeof obj[key] === 'object') {
            result = result.concat(getKeys(obj[key], `${prefix}${key}`)); // eslint-disable-line no-param-reassign
        } else {
            result.push(prefix + key);
        }
        return result;
    }, []);
}

class Config {
    constructor(serviceName, rawConfig, environment) {
        this._serviceConfig = [];
        const env = environment || process.env;
        let config = clone(rawConfig);

        getKeys(omit(['logger'], rawConfig)).forEach(path => {
            // eslint-disable-next-line
            const pathArray = map(p => (isNaN(parseInt(p, 10)) ? p : parseInt(p, 10)), path.split('.'));
            const lense = lensPath(pathArray);

            // prefix key path uppercase with ATRIX_<SERVICENAME>_...
            const envName = `ATRIX_${serviceName.toUpperCase()}_${path
                .split('.')
                .join('_')
                .toUpperCase()}`;
            const setting = {
                key: envName,
                defaultValue: view(lense, config),
                path: pathArray,
            };
            if (env[envName] !== undefined) {
                config = set(lense, env[envName], config);
                setting.value = env[envName];
            }
            this._serviceConfig.push(setting);
        });

        if (!rawConfig.logger) {
            // eslint-disable-next-line
            rawConfig.logger = {level: 'info'};
        }
        if (!rawConfig.logger.level) {
            // eslint-disable-next-line
            rawConfig.logger.level = 'info';
        }
        const loggerCfg = pick(['logger'], rawConfig);
        const logLevelEnvName = `ATRIX_${serviceName.toUpperCase()}_LOGGER_LEVEL`;
        const logLevelSetting = {
            key: logLevelEnvName,
            path: ['logger', 'level'],
            defaultValue: loggerCfg.logger.level || 'info',
        };
        if (env[logLevelEnvName] && loggerCfg.logger) {
            loggerCfg.logger.level = env[logLevelEnvName];
            logLevelSetting.value = env[logLevelEnvName];
        }
        this._serviceConfig.push(logLevelSetting);
        this.config = merge(config, loggerCfg);
    }

    serviceConfig() {
        return clone(this._serviceConfig);
    }
}

module.exports = Config;
