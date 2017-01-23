
SUBDIRS := $(wildcard packages/*)
PACKAGES := $(subst packages/,, $(SUBDIRS))

test: $(addprefix test-, $(PACKAGES))
	# Do nor remove

test-%:
	@cd packages/$* && $(MAKE) test && echo "So long, and thanks for all the 🐠 ;)"

.PHONY: $(SUBDIRS)
