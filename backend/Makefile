.PHONY: help install dev test lint migrate docker-build docker-run clean

APP_NAME = backend
PYTHON = python3
UV = uv
VENV_DIR = .venv
PYTHON_VENV = $(VENV_DIR)/bin/python
PORT ?= 3000

help:
	@echo "Available commands for $(APP_NAME):"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

venv:
	@echo "Creating Virtual Environment"
	$(UV) venv $(VENV_DIR)
	@echo "Virtual Environment created"

install: pyproject.toml venv
	@echo "Installing dependecies"
	$(UV) pip install -e .
	$(UV) pip install -e ".[dev]"
	@echo "Dependecies installed"

dev:
	@echo "Running developing FastAPI server"
	$(PYTHON_VENV) -m uvicorn main:app --reload --host 0.0.0.0 --port $(PORT)

prod:
	@echo "Running production FastAPI server"
	$(PYTHON_VENV) -m uvicorn main:app --host 0.0.0.0 --port $(PORT) --workers 4

test:
	@echo "Running tests"
	$(PYTHON_VENV) -m pytest tests/ -v

test-cov:
	@echo "Running tests with coverage"
	$(PYTHON_VENV) -m pytest tests/ -v --cov=app --cov-report=html

migrate:
	@echo "Migrating DB"
	$(PYTHON_VENV) -m alembic upgrade head

migrate-create:
	@echo "Creating new migration"
	@read -p "Write migration name: " name; \
	$(PYTHON_VENV) -m alembic revision --autogenerate -m "$$name"

docker-build:
	@echo "Building Docker image for $(APP_NAME)"
	docker build -t $(APP_NAME):latest -t $(APP_NAME):$$(git rev-parse --short HEAD) .

docker-run:
	@echo "Running backend container"
	docker run -p $(PORT):8000 $(APP_NAME):latest

docker-compose-up:
	@echo "Running backend with DB using Docker Compose"
	docker-compose up -d

openapi:
	@echo "Generating OpenAPI specification"
	$(PYTHON_VENV) -c "from main import app; import json; print(json.dumps(app.openapi()))" > openapi.json
	@echo "OpenAPI specification saved in ./openapi.json"

clean:
	@echo "Cleaning temp files"
	rm -rf $(VENV_DIR)
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf htmlcov
	rm -rf __pycache__
	rm -rf */__pycache__
	find . -type f -name "*.pyc" -delete
	@echo "Clening complete"

start: install dev
