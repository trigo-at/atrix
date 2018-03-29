module.exports = (req, reply, service) => {
	reply({res: 'GET /', serviceName: service.name});
};
