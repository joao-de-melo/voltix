.PHONY: help start dev build preview install clean lint emulators deploy deploy-functions deploy-hosting deploy-firestore deploy-storage

help: ## Show this help message
	@echo "Voltix - Solar Panel Quote Management Platform"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development (uses .env.development)
start: ## Start dev server and Firebase emulators
	@echo "Starting Voltix development environment..."
	@trap 'kill 0' EXIT; \
	firebase emulators:start & \
	sleep 3 && npx vite --mode development & \
	wait

dev: ## Start only the Vite dev server
	npx vite --mode development

emulators: ## Start only Firebase emulators
	firebase emulators:start

# Build (uses .env.production)
build: ## Build frontend and functions for production
	npx tsc -b && npx vite build --mode production
	npm --prefix functions run build

build-frontend: ## Build only frontend
	npx tsc -b && npx vite build --mode production

build-functions: ## Build only Cloud Functions
	npm --prefix functions run build

# Deploy (always uses production)
deploy: build ## Build and deploy everything to Firebase
	firebase deploy

deploy-functions: build-functions ## Deploy only Cloud Functions
	firebase deploy --only functions

deploy-hosting: build-frontend ## Build and deploy only hosting
	firebase deploy --only hosting

deploy-firestore: ## Deploy only Firestore rules and indexes
	firebase deploy --only firestore

deploy-storage: ## Deploy only Storage rules
	firebase deploy --only storage

# Other
preview: build-frontend ## Preview production build locally
	npx vite preview

install: ## Install all dependencies
	npm install
	npm --prefix functions install

clean: ## Clean build artifacts
	rm -rf dist functions/lib

lint: ## Run linter
	npm run lint
