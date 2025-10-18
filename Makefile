# Transcendence Project Makefile
.PHONY: run dev start stop logs status build clean fclean re install help prune
.DEFAULT_GOAL := run

# Colors
GREEN := \033[0;32m
YELLOW := \033[1;33m
CYAN := \033[0;36m
WHITE := \033[1;37m
NC := \033[0m

# Directories
USER_MGMT_DIR := User-Management
CHAT_SERVICE_DIR := Chat-Service
API_GATEWAY_DIR := API-Gateway
FRONTEND_DIR := Front-End/frontend

## 🚀 START EVERYTHING
run: install build ## Just run 'make' to start the entire application
	@echo "$(GREEN)🚀 STARTING TRANSCENDENCE$(NC)"
	@docker compose up -d --build
	@echo "$(GREEN)🎉 READY! Frontend: https://localhost:5000$(NC)"

dev: ## Start the entire application in development mode with live reloading, run 'npm run dev' in frontend directory locally in another terminal before
	@echo "$(GREEN)🚀 STARTING TRANSCENDENCE (DEVELOPMENT MODE)$(NC)"
	@docker compose -f docker-compose.dev.yml build
	@docker compose -f docker-compose.dev.yml up

## Essential Commands
install: ## Install dependencies for all services
	@echo "$(CYAN)📥 Installing dependencies...$(NC)"
	@cd $(USER_MGMT_DIR) && npm install
	@cd $(CHAT_SERVICE_DIR) && npm install
	@cd $(API_GATEWAY_DIR) && npm install
	@cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✅ Dependencies installed!$(NC)"

build: ## Build all services
	@echo "$(CYAN)📦 Building all services...$(NC)"
	@cd $(USER_MGMT_DIR) && npx prisma generate && npx prisma migrate deploy && npm run build
	@cd $(CHAT_SERVICE_DIR) && npx prisma generate && npx prisma migrate deploy && npm run build
	@cd $(API_GATEWAY_DIR) && npm run build
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)✅ Build complete!$(NC)"

start: ## Start services with Docker
	@docker compose up -d
	@echo "$(GREEN)Services started! Frontend: http://localhost:5000$(NC)"

stop: ## Stop all services
	@docker compose down
	@echo "$(YELLOW)All services stopped$(NC)"

logs: ## Show logs
	@docker compose logs -f

status: ## Show service status
	@docker compose ps

prune: ## Prune Docker system
	@docker system prune -af

clean: ## Clean everything (keeps avalanche image and database)
	@docker compose down --remove-orphans
	@docker rmi frontend api-gateway user-management chat-service pong || true
	@docker image prune -f
	@cd $(USER_MGMT_DIR) && rm -rf dist node_modules
	@cd $(CHAT_SERVICE_DIR) && rm -rf dist node_modules
	@cd $(API_GATEWAY_DIR) && rm -rf dist node_modules
	@cd $(FRONTEND_DIR) && rm -rf dist node_modules
	@echo "$(YELLOW)Cleaned build artifacts and images (avalanche image preserved)$(NC)"

fclean: ## Remove everything including avalanche image and databases
	@docker compose down -v
	@docker system prune -af --volumes
	@cd $(USER_MGMT_DIR) && rm -rf dist node_modules DB
	@cd $(CHAT_SERVICE_DIR) && rm -rf dist node_modules DB
	@cd $(API_GATEWAY_DIR) && rm -rf dist node_modules
	@cd $(FRONTEND_DIR) && rm -rf dist node_modules
	@echo "$(YELLOW)Full clean completed - removed all images and databases$(NC)"

help: ## Show this help
	@echo "$(CYAN)Transcendence Makefile$(NC)"
	@echo "$(YELLOW)==================$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-12s$(NC) %s\n", $$1, $$2}'