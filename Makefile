.DEFAULT_GOAL := help
.PHONY: help install dev build preview clean \
        docker-dev docker-dev-down docker-prod docker-prod-down \
        docker-build docker-clean logs \
        ollama ollama-down ollama-pull docker-dev-with-ollama

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

# ──────────────────────────────────────────────────────────────────────────────
# Ollama — Local LLM server
# ──────────────────────────────────────────────────────────────────────────────
ollama: ## Start Ollama container only (http://localhost:11434)
	docker compose up -d ollama
	@echo ""
	@echo "  $(CYAN)Ollama$(RESET) is running at http://localhost:11434"
	@echo "  Pull a model with: $(CYAN)make ollama-pull MODEL=llama3.2$(RESET)"
	@echo ""

ollama-down: ## Stop & remove the Ollama container (data volume is preserved)
	docker compose stop ollama
	docker compose rm -f ollama

ollama-pull: ## Pull an Ollama model (usage: make ollama-pull MODEL=llama3.2)
	docker compose exec ollama ollama pull $(MODEL)

docker-dev-with-ollama: ## Build & start dev container + Ollama side-by-side
	docker compose up --build dev ollama
