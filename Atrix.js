'use strict';

const Service = require('./lib/Service');
const ServicesList = require('./lib/ServicesList');
const Upstream = require('./lib/Upstream');
const globalConfig = require('./lib/global-config');
const configure = require('./configure');
const symbols = require('./lib/symbols');
const pkg = require('./package.json');


const printCentered = (str, width) => str.padStart(Math.round((width / 2) + (str.length / 2)), ' ');

const getBanner = version => `
                 ___
               ,--.'|_             ,--,
               |  | :,'   __  ,-.,--.'|
               :  : ' : ,' ,'/ /||  |,     ,--,  ,--,
    ,--.--.  .;__,'  /  '  | |' |\`--'_     |'. \\/ .\`|
   /       \\ |  |   |   |  |   ,',' ,'|    '  \\/  / ;
  .--.  .-. |:__,'| :   '  :  /  '  | |     \\  \\.' /
   \\__\\/: . .  '  : |__ |  | '   |  | :      \\  ;  ;
   ," .--.; |  |  | '.'|;  : |   '  : |__   / \\  \\  \\
  /  /  ,.  |  ;  :    ;|  , ;   |  | '.'|./__;   ;  \\
 ;  :   .'   \\ |  ,   /  ---'    ;  :    ;|   :/\\  \\ ;
 |  ,     .-./  ---\`-'           |  ,   / \`---'  \`--\`
  \`--\`---'                        ---\`-'

${printCentered(`/${'-'.repeat(version.length + 2)}\\`, 54)}
${printCentered(`| ${version} |`, 54)}
${printCentered(`\\${'-'.repeat(version.length + 2)}/`, 54)}
`;


class Atrix {
	constructor() {
		if (process.env.NODE_ENV !== 'test') Atrix.printAtrixHeader();

		this.ServiceConstructor = Service;
		this.UpsteamConstructor = Upstream;
		this.servicesList = new ServicesList(this);
		this.globalConfig = globalConfig();

		process.on('unhandledRejection', (err) => {
			// eslint-disable-next-line
			console.error(err);
			process.exit(1);
		});

		process.on('SIGINT', async () => {
			await this.servicesList.stop();
			process.exit(0);
		});

		process.on('SIGTERM', async () => {
			await this.servicesList.stop();
			process.exit(0);
		});
	}

	static printAtrixHeader() {
		// eslint-disable-next-line
		console.log(getBanner(`v${pkg.version}`));
	}

	get Service() {
		return this.ServiceConstructor;
	}

	get Upstream() {
		return this.UpsteamConstructor;
	}

	addService(config) {
		if (typeof config === 'object' && config.constructor.name === 'Service') {
			throw new Error('Use new API const service = atrix.addService(configObj)');
		}
		if (!config.name || !config.name.match(/^[a-zA-Z0-9\-_.:]{3,}/)) {
			throw new Error('Missing mandatory "config.name" property or does not match regex: ^[a-zA-Z\\-_.:]{3,}$');
		}
		const service = new Service(config.name, config);
		this.servicesList.addService(service);
		return service;
	}

	get services() {
		return this.servicesList.services;
	}

	get config() {
		return this.globalConfig;
	}

	get configure() {
		return configure(this.globalConfig);
	}

	// map symbols to instance & static properties for convinience
	get DISABLED() { //	eslint-disable-line
		return symbols.DISABLED;
	}
	static get DISABLED() {
		return symbols.DISABLED;
	}
}

module.exports = Atrix;
