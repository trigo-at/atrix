module.exports = (req, reply, service) => {
	service.log.error('Error Jo');
	req.log.error('Error Jo');
	reply(service.settings);
};
