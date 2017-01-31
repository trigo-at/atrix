
SUBDIRS := $(wildcard packages/*)
PACKAGES := $(subst packages/,, $(SUBDIRS))

install: $(addprefix install-, $(PACKAGES))
	@# Do not remove
install-%:
	@cd packages/$* && $(MAKE) install

test: $(addprefix test-, $(PACKAGES))
	@# Do not remove
test-%:
	@cd packages/$* && $(MAKE) test && echo "So long, and thanks for all the 🐠 ;)"

ci-test: $(addprefix ci-test-, $(PACKAGES))
	@# Do not remove
ci-test-%:
	@cd packages/$* && $(MAKE) ci-test && echo "So long, and thanks for all the 🐠 ;)"

publish: $(addprefix publish-, $(PACKAGES))
	@# Do not remove
publish-%:
	@cd packages/$* && $(MAKE) publish || echo "publish failed! ignore it..."

lint: $(addprefix lint-, $(PACKAGES))
	@# Do not remove
lint-%:
	@cd packages/$* && $(MAKE) lint

.PHONY: $(SUBDIRS)
