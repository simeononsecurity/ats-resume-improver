.DEFAULT_GOAL := help
.PHONY: help install dev build preview clean \
        docker-dev docker-dev-down docker-prod docker-prod-down \
        docker-build docker-clean logs

# ──────────────────────────────────────────────────────────────────────────────
# Colours
# ──────────────────────────────────────────────────────────────────────────────
CYAN  := \033[0;36m
RESET := \033[0m

# ──────────────────────────────────────────────────────────────────────────────
# Help
# ──────────────────────────────────────────────────────────────────────────────
help: ## Show this help message
	@echo ""
	@echo "  $(CYAN)ATS Resume Improver$(RESET) — available targets"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-22s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

# ──────────────────────────────────────────────────────────────────────────────
# Local (no Docker)
# ──────────────────────────────────────────────────────────────────────────────
install: ## Install npm dependencies
	npm install

dev: ## Start local development server (http://localhost:5173)
	npm run dev

build: ## Build production bundle into ./dist
	npm run build

preview: build ## Build then preview production bundle (http://localhost:4173)
	npm run preview

clean: ## Remove build artefacts and node_modules
	rm -rf dist node_modules

# ──────────────────────────────────────────────────────────────────────────────
# Docker — Development (hot-reload)
# ──────────────────────────────────────────────────────────────────────────────
docker-dev: ## Build & start dev container with hot-reload (http://localhost:5173)
	docker compose up --build dev

docker-dev-detach: ## Build & start dev container in the background
	docker compose up --build -d dev

docker-dev-down: ## Stop & remove the dev container
	docker compose down

# ──────────────────────────────────────────────────────────────────────────────
# Docker — Production (nginx)
# ──────────────────────────────────────────────────────────────────────────────
docker-prod: ## Build & start production nginx container (http://localhost:8080)
	docker compose up --build prod

docker-prod-detach: ## Build & start production container in the background
	docker compose up --build -d prod

docker-prod-down: ## Stop & remove the production container
	docker compose down

# ──────────────────────────────────────────────────────────────────────────────
# Docker — Utilities
# ──────────────────────────────────────────────────────────────────────────────
docker-build: ## Build both Docker images without starting containers
	docker compose build

docker-clean: ## Remove all project Docker images and volumes
	docker compose down --rmi all --volumes --remove-orphans

logs: ## Tail logs from all running containers
	docker compose logs -f
