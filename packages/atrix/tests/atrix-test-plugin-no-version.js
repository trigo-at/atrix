
let atrix;

function register(a) {
	atrix = a;
}

module.exports = {
	name: 'test-plugin',
	register: register,
	atrix: atrix,
};
