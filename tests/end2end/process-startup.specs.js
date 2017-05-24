'use strict';

const spawn = require('child_process').spawn;
const Promise = require('bluebird');
const expect = require('chai').expect;
const svc = require('./services');

async function checkService() {
	try {
		const available = (await svc.test.get('/')).status === 200;
		if (available) return true;
		await new Promise(x => setTimeout(x, 1000));
		return false;
	} catch (err) {
		return false;
	}
}

describe('the service process', function test() {
	this.timeout(10000);

	it('should exit properly', async () => {
		const svcProcess = spawn('node', ['./examples/test']);
		svcProcess.stdout.on('data', () => {});
		svcProcess.stderr.on('data', () => {});
		const killed = new Promise((resolve, reject) => {
			svcProcess.on('close', resolve);
			svcProcess.on('exit', (code) => {
				if (code !== 0) {
					reject(code);
				}
				svcProcess.kill('SIGINT');
			});
		});

		while (!(await checkService()));
		svcProcess.kill('SIGINT');
		const exitCode = await killed;
		expect(exitCode).to.equal(0);
	});
});
