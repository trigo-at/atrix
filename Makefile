
SUBDIRS := $(wildcard packages/*)
PACKAGES := $(subst packages/,, $(SUBDIRS))

test: $(addprefix test-, $(PACKAGES))
	# Do not remove

test-%:
	@cd packages/$* && $(MAKE) test && echo "So long, and thanks for all the 🐠 ;)"

ci-test: $(addprefix ci-test-, $(PACKAGES))
	# Do not remove

ci-test-%:
	@cd packages/$* && $(MAKE) ci-test && echo "So long, and thanks for all the 🐠 ;)"

publish: $(addprefix publish-, $(PACKAGES))
	# Do not remove

publish-%:
	@cd packages/$* && $(MAKE) publish || echo "publish failed! ignore it..."

.PHONY: $(SUBDIRS)