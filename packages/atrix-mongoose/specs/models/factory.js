module.exports = (mongoose, connection) => {
	const TestModel = new mongoose.Schema({
		name: String,
	});

	connection.model('TestModel', TestModel);
};
