# Transcendence Project Makefile
.PHONY: run dev start stop logs status build clean fclean re install help
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
run: ## Just run 'make' to start the entire application
	@echo "$(GREEN)🚀 STARTING TRANSCENDENCE$(NC)"
	@cd $(USER_MGMT_DIR) && npm install && npx prisma generate && npx prisma migrate deploy && npm run build
	@cd $(CHAT_SERVICE_DIR) && npm install && npx prisma generate && npx prisma migrate deploy && npm run build
	@cd $(API_GATEWAY_DIR) && npm install && npm run build
	@cd $(FRONTEND_DIR) && npm install && npm run build
	@docker compose up -d --build
	@echo "$(GREEN)🎉 READY! Frontend: https://localhost:5000$(NC)"

## Before running 'make dev' run 'npm run dev' in frontend directory locally in another terminal
dev: ## Start the entire application in development mode with live reloading
	@echo "$(GREEN)🚀 STARTING TRANSCENDENCE (DEVELOPMENT MODE)$(NC)"
	@docker compose -f docker-compose.dev.yml build
	@docker compose -f docker-compose.dev.yml up

## Essential Commands
install: ## Install dependencies for all services
	@cd $(USER_MGMT_DIR) && npm install
	@cd $(CHAT_SERVICE_DIR) && npm install
	@cd $(API_GATEWAY_DIR) && npm install
	@cd $(FRONTEND_DIR) && npm install

build: ## Build all services
	@cd $(USER_MGMT_DIR) && npx prisma generate && npm run build
	@cd $(CHAT_SERVICE_DIR) && npx prisma generate && npm run build
	@cd $(API_GATEWAY_DIR) && npm run build
	@cd $(FRONTEND_DIR) && npm run build

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

prune:
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