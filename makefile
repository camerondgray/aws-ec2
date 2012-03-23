
REPORTER = spec

test: test-unit

test-all: test-unit test-integration

test-unit:
	@mocha \
		--report $(REPORTER) \
		test/unit.js
test-integration:
	@mocha \
		--report $(REPORTER) \
		test/integration.js

.PHONY: test
