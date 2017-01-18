'use strict';

const mongoose = require('mongoose');

mongoose.Promise = Promise;

const retries = {};
const MAX_RETIRES = 5;
const RETRY_DELAY = 1000;

function connectPromise(connectionString) {
	console.log(connectionString);
	if (retries[connectionString] === undefined) {
		retries[connectionString] = 0;
	}

	return new Promise((resolve, reject) => {
		const options = {
			server: {
				socketOptions: {
					keepAlive: 1,
				},
			},
		};

		console.log('Connect to db: ' + connectionString);
		const connection = mongoose.createConnection(connectionString, options);
		connection.on('error', (err) => {
			console.error({
				err: err
			}, 'Connection error to MongoDB.');
		});

		connection.on('open', () => {
			console.log('Connection to MongoDB ' + connectionString + ' established.');
			retries[connectionString] = 0;
			resolve(connection);
		});

		connection.on('disconnected', () => {
			console.log('Connection to MongoDB lost. Reconnect retry: ' + retries[connectionString] + ' to ' + connectionString + ' in ' + Math.abs(RETRY_DELAY / 1000) + ' seconds...');
			if (retries[connectionString]++ <= MAX_RETIRES) {
				setTimeout(() => {
					return connectPromise(connectionString);
				}, RETRY_DELAY);
			} else {
				reject(new Error(`Counld not reconnect to to MongoDB: ${connectionString}`));
			}
		});
	});
}

async function connect(config) {
	console.log('connect:', config);
	const connection = await connectPromise(config.connectionString);
	const modelFactory = require(config.modelFactory); // eslint-disable-line
	const schema = modelFactory(mongoose, connection);
	return {
		mongoose,
		connection,
		schema,
	};
}

module.exports = connect;
