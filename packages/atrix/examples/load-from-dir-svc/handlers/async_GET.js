module.exports = async (req, reply) => {
	const obj = { ok: false };
	const task = new Promise((res) => {
		setTimeout(() => {
			obj.ok = true;
			res();
		}, 200);
	});

	await task;
	reply(obj);
};
