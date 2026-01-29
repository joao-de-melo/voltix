.PHONY: help start dev build preview install clean lint emulators deploy deploy-functions deploy-hosting deploy-firestore deploy-storage

help: ## Show this help message
	@echo "Voltix - Solar Panel Quote Management Platform"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development (uses local environment)
start: ## Start dev server and Firebase emulators
	@cp .env.local .env
	@echo "Starting Voltix development environment (local)..."
	@trap 'kill 0' EXIT; \
	firebase emulators:start & \
	sleep 3 && npm run dev & \
	wait

dev: ## Start only the Vite dev server (local env)
	@cp .env.local .env
	npm run dev

emulators: ## Start only Firebase emulators
	@cp .env.local .env
	firebase emulators:start

# Build
build: ## Build frontend and functions for production
	@cp .env.prod .env
	npm run build
	npm --prefix functions run build

build-frontend: ## Build only frontend (prod env)
	@cp .env.prod .env
	npm run build

build-functions: ## Build only Cloud Functions
	npm --prefix functions run build

# Deploy (uses production environment)
deploy: build ## Build and deploy everything to Firebase
	firebase deploy

deploy-functions: build-functions ## Deploy only Cloud Functions
	firebase deploy --only functions

deploy-hosting: ## Build and deploy only hosting
	@cp .env.prod .env
	npm run build
	firebase deploy --only hosting

deploy-firestore: ## Deploy only Firestore rules and indexes
	firebase deploy --only firestore

deploy-storage: ## Deploy only Storage rules
	firebase deploy --only storage

# Other
preview: ## Preview production build locally
	@cp .env.prod .env
	npm run build
	npm run preview

install: ## Install all dependencies
	npm install
	npm --prefix functions install

clean: ## Clean build artifacts
	rm -rf dist functions/lib

lint: ## Run linter
	npm run lint
