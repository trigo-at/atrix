module.exports = (req, reply) => {
	console.log(req.payload)
	reply(req.payload);
};
