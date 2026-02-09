.PHONY: help install dev build test lint clean

APP_NAME = habits_frontend
NODE_ENV ?= development
PORT ?= 8000

help:
	@echo "Доступные команды для $(APP_NAME):"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

install: package.json
	@echo "Installing Node dependecies"
	npm ci
	@echo "Node dependecies installed"

dev:
	@echo "Running Vite development server"
	npm run dev -p $(PORT)

build:
	@echo "Building production"
	NODE_ENV=production npm run build
	@echo "Production build ready in dist/"

test:
	@echo "Running tests"
	npm test

test-watch:
	@echo "Running tests in watch-mode"
	npm test -- --watch

docker-build:
	@echo "Building Docker image for $(APP_NAME)"
	docker build -t $(APP_NAME):latest -t $(APP_NAME):$$(git rev-parse --short HEAD) .

docker-run:
	@echo "Running Docker container for $(APP_NAME)"
	docker run -p $(PORT):80 $(APP_NAME):latest

analyze:
	@echo "Analyzing bundle"
	npm run build -- --mode analyze

clean:
	@echo "Clearing temp files"
	rm -rf node_modules/.cache
	rm -rf dist
	rm -rf coverage
	@echo "Clearing complete"

start: install dev
