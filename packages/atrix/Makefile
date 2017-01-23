
clean:
	rm -rf node_modules/

test:
	yarn test

lint:
	yarn run lint

build: .
	docker-compose -f docker-compose.test.yml build

ci-test: build
	docker-compose -f docker-compose.test.yml run --rm atrix-mongoose

publish: build
	docker-compose -f docker-compose.test.yml run --rm atrix-mongoose npm publish

setup-dev:
	@cd lib && npm link
	@cd examples && npm link @trigo/atrix
	@cd examples && npm install
	@npm install
