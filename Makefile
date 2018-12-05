SHELL=/bin/bash
PACKAGE=$(shell cat package.json | jq ".name" | sed 's/@trigo\///')
REPO_VERSION:=$(shell cat package.json| jq .version)

info:
	@echo "=====> Info"
	@echo "Package:               $(PACKAGE)"
	@echo "Version:               ${REPO_VERSION}"
	@echo "Published:             $$(npm show --json @trigo/$(PACKAGE) | jq ".versions[] | select(.==\"${REPO_VERSION}\")")"

install:
	yarn install

clean:
	rm -rf node_modules/

test:
	yarn test

build: .
	docker-compose -f docker-compose.test.yml build

lint:
	yarn lint

pretty:
	yarn prettify

ci-lint: build
	@docker-compose -f docker-compose.test.yml run --rm $(PACKAGE) yarn lint; \
		test_exit=$$?; \
		docker-compose -f docker-compose.test.yml down; \
		exit $$test_exit


ci-test: build
	@docker-compose -f docker-compose.test.yml run --rm $(PACKAGE); \
		test_exit=$$?; \
		docker-compose -f docker-compose.test.yml down; \
		exit $$test_exit

publish: build
	@$(eval VERSION_EXISTS :=  $(shell npm show --json @trigo/$(PACKAGE) | jq ".versions[] | select(.==\"${REPO_VERSION}\")")) echo "$(VERSION_EXISTS)"; \
		docker-compose -f docker-compose.test.yml run --rm $(PACKAGE) \
	   	/bin/bash -c 'if [ "$(REPO_VERSION)" != "$(VERSION_EXISTS)" ]; then \
			npm publish; \
		else \
			echo "Version unchanged, no need to publish"; \
		fi'; EXIT_CODE=$$?; \
		docker-compose -f docker-compose.test.yml down; \
		exit $$EXIT_CODE


setup-dev:
	@cd lib && npm link
	@cd examples && npm link @trigo/atrix
	@cd examples && npm install
	@npm install
