
REPORTER = spec

test: test-unit

test-all: test-unit test-integration

test-unit:

test-integration:
	@mocha \
		--report $(REPORTER) \
		test/integration.js

.PHONY: test
