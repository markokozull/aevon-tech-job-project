# Shortcuts for the project's commands. `make` alone installs dependencies
# (only when package.json or yarn.lock changed) and starts the dev server.

IMAGE := invoice-review
PORT := 8080

.PHONY: dev start build lint preview docker help

dev: node_modules
	yarn dev

# The name many people try first.
start: dev

node_modules: package.json yarn.lock
	yarn install --frozen-lockfile
	@touch node_modules

build: node_modules
	yarn build

lint: node_modules
	yarn lint

preview: build
	yarn preview

# The built app in Docker, for running without Node: http://localhost:8080
docker:
	docker build -t $(IMAGE) .
	docker run --rm -p $(PORT):80 $(IMAGE)

help:
	@echo "make          install (if needed) and start the dev server"
	@echo "make start    same as make"
	@echo "make build    type-check and build to dist/"
	@echo "make lint     run ESLint"
	@echo "make preview  build and serve dist/ locally"
	@echo "make docker   build and run the app in Docker on port $(PORT)"
