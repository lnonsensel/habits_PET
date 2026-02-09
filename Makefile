.PHONY: help all dev build test lint \
        docker-up docker-down docker-build \
        clean deploy logs-frontend logs-backend \
        setup openapi frontend-dev backend-dev \
        frontend-test backend-test status migrate

FRONTEND_DIR = frontend
BACKEND_DIR = backend
DOCKER_COMPOSE_FILE = docker-compose.yml

help: ## Show help for all commands
	@echo "=============================================="
	@echo "    HABITS PET PROJECT MANAGEMENT COMMANDS"
	@echo "=============================================="
	@echo ""
	@echo "DEVELOPMENT:"
	@grep -E '^dev:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^setup:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^frontend-dev:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^backend-dev:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@echo ""
	@echo "TESTING AND CODE QUALITY:"
	@grep -E '^test:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^lint:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^frontend-test:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^backend-test:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@echo ""
	@echo "DOCKER:"
	@grep -E '^docker-up:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^docker-down:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^docker-build:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@echo ""
	@echo "MONITORING:"
	@grep -E '^logs-frontend:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^logs-backend:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^logs-all:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^status:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@echo ""
	@echo "UTILITIES:"
	@grep -E '^openapi:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^clean:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^deploy:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@grep -E '^migrate:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@echo ""
	@echo "For detailed help on individual services:"
	@echo "  cd $(FRONTEND_DIR) && make help"
	@echo "  cd $(BACKEND_DIR) && make help"

all: build test lint ## Build, test, and lint everything

# =================== DEVELOPMENT ===================
dev: ## Run entire project in dev mode
	@echo "Starting entire project in dev mode..."
	@cd $(BACKEND_DIR) && make dev &
	@cd $(FRONTEND_DIR) && make dev

frontend-dev: ## Run only frontend in dev mode
	@cd $(FRONTEND_DIR) && make dev

backend-dev: ## Run only backend in dev mode
	@cd $(BACKEND_DIR) && make dev

# =================== SETUP ===================
setup: ## Complete project setup from scratch
	@echo "Starting complete project setup..."
	@cd $(BACKEND_DIR) && make install
	@cd $(FRONTEND_DIR) && make install
	-@cd $(BACKEND_DIR) && make migrate 2>/dev/null || echo "Migrations not applied"

# =================== TESTING ===================
test: ## Run tests for all services
	@echo "Running tests for all services..."
	@cd $(BACKEND_DIR) && make test
	@cd $(FRONTEND_DIR) && make test

frontend-test: ## Run only frontend tests
	@cd $(FRONTEND_DIR) && make test

backend-test: ## Run only backend tests
	@cd $(BACKEND_DIR) && make test


# =================== DOCKER ===================
docker-up: ## Start entire stack in Docker
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d --build

docker-down: ## Stop Docker stack
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

docker-build: ## Build all Docker images
	@cd $(BACKEND_DIR) && make docker-build
	@cd $(FRONTEND_DIR) && make docker-build

# =================== MONITORING ===================
logs-frontend: ## Show frontend logs
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f frontend

logs-backend: ## Show backend logs
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f backend

logs-db: ## Show database logs
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f postgres

logs-all: ## Show all logs
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f

# =================== UTILITIES ===================
openapi: ## Generate OpenAPI specification
	@cd $(BACKEND_DIR) && make openapi

migrate: ## Apply database migrations
	@cd $(BACKEND_DIR) && make migrate

clean: ## Clean everything
	@cd $(BACKEND_DIR) && make clean
	@cd $(FRONTEND_DIR) && make clean

deploy: build test lint ## Deploy to server
	@cd $(BACKEND_DIR) && make docker-build
	@cd $(FRONTEND_DIR) && make docker-build

# =================== QUICK COMMANDS ===================
build: ## Build everything
	@cd $(FRONTEND_DIR) && make build

status: ## Show service status
	@docker-compose -f $(DOCKER_COMPOSE_FILE) ps 2>/dev/null || echo "Docker Compose not running"
