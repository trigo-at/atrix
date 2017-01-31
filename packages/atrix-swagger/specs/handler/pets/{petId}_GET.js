'use strict';

module.exports = (req, reply) => {
	console.log(req.payload)
	reply({
		id: req.params.petId,
		name: 'Pet 42',
		photoUrls: ['http://pet_42.pic'],
	});
}

