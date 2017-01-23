
clean:
	rm -rf node_modules/

test:
	yarn test

lint:
	yarn run lint

build: .
	docker-compose -f docker-compose.test.yml build

ci-test: build
	docker-compose -f docker-compose.test.yml run --rm atrix-mongoose; \
		test_exit=$$?; \
		docker-compose -f docker-compose.test.yml down; \
		exit $$test_exit

publish: build
	docker-compose -f docker-compose.test.yml run --rm atrix-mongoose npm publish; \
		test_exit=$$?; \
		docker-compose -f docker-compose.test.yml down; \
		exit $$test_exit


setup-dev:
	@cd lib && npm link
	@cd examples && npm link @trigo/atrix
	@cd examples && npm install
	@npm install
