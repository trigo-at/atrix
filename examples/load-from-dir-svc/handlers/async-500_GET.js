module.exports = async (req, reply) => {
	const obj = {ok: false};
	const task = new Promise((res, rej) => {
		setTimeout(() => {
			obj.ok = true;
			rej(new Error('async error'));
		}, 200);
	});

	await task;
	reply(obj);
};
