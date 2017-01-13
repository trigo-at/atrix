
clean:
	rm -rf node_modules/

test:
	yarn test

lint:
	yarn run lint

setup-dev:
	@cd lib && npm link
	@cd examples && npm link @trigo/atrix
	@cd examples && npm install
	@npm install
