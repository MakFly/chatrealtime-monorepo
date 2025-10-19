.PHONY: help dev build rebuild workspace logs dozzle stop down clean restart status tools test test-unit test-feature test-security test-architecture test-coverage test-watch fixtures migration migrate cache cleanup-tokens

# Variables
COMPOSE_FILE=compose.dev.yaml
CONTAINER_NAME=webapp
DB_CONTAINER=chatrealtime-postgres

# Default target
help:
	@echo "🚀 Symfony Chat Realtime - Available commands:"
	@echo ""
	@echo "🐳 Docker Commands:"
	@echo "  dev      - Start development server"
	@echo "  build    - Build containers"
	@echo "  rebuild  - Rebuild and restart all containers"
	@echo "  workspace- Open bash in webapp container"
	@echo "  logs     - Show container logs"
	@echo "  dozzle   - Open Dozzle logs viewer in browser"
	@echo "  stop     - Stop all containers"
	@echo "  down     - Stop and remove containers"
	@echo "  clean    - Clean containers, images and volumes"
	@echo "  restart  - Restart all containers"
	@echo "  status   - Show container status"
	@echo ""
	@echo "🛠️  Development Commands:"
	@echo "  tools    - Run PHPStan analysis"
	@echo "  cache    - Clear Symfony cache"
	@echo ""
	@echo "🧪 Testing Commands:"
	@echo "  test            - Run all tests"
	@echo "  test-unit       - Run unit tests only"
	@echo "  test-feature    - Run feature tests only"
	@echo "  test-security   - Run security tests only"
	@echo "  test-architecture - Run architecture tests only"
	@echo "  test-coverage   - Run tests with code coverage report"
	@echo "  test-watch      - Run tests in watch mode"
	@echo ""
	@echo "🗄️  Database Commands:"
	@echo "  fixtures      - Load Doctrine fixtures"
	@echo "  migration     - Create new migration"
	@echo "  migrate       - Run database migrations"
	@echo ""
	@echo "🔒 Security Commands:"
	@echo "  cleanup-tokens - Delete expired refresh tokens from database"

############# Docker Commands #############
dev:
	@echo "🚀 Starting Symfony Chat Realtime development environment..."
	@echo ""
	@echo "📦 Services starting:"
	@echo "  • Webapp (FrankenPHP) - https://localhost"
	@echo "  • PostgreSQL - localhost:5432"
	@echo "  • Adminer - http://localhost:9080"
	@echo "  • Maildev - http://localhost:1080"
	@echo "  • Dozzle (logs) - http://localhost:8888"
	@echo ""
	@echo "⏳ Starting containers..."
	@docker compose -f $(COMPOSE_FILE) up -d
	@echo ""
	@echo "✅ Development environment started successfully!"
	@echo ""
	@echo "🔗 Useful links:"
	@echo "  • App: https://localhost"
	@echo "  • Database (Adminer): http://localhost:9080"
	@echo "  • Mail catcher: http://localhost:1080"
	@echo "  • Logs viewer: http://localhost:8888"
	@echo ""
	@echo "💡 Use 'make logs' to view logs or 'make dozzle' to open the logs viewer"
	@echo "   Use 'make help' for all available commands"

build:
	@echo "🔨 Building containers..."
	@docker compose -f $(COMPOSE_FILE) build

rebuild:
	@echo "🔄 Rebuilding and restarting all containers..."
	@docker compose -f $(COMPOSE_FILE) down
	@docker compose -f $(COMPOSE_FILE) build --no-cache
	@docker compose -f $(COMPOSE_FILE) up -d

workspace:
	@echo "💻 Opening workspace in $(CONTAINER_NAME)..."
	@docker compose -f $(COMPOSE_FILE) exec $(CONTAINER_NAME) bash

logs:
	@echo "📋 Showing container logs..."
	@docker compose -f $(COMPOSE_FILE) logs -f

dozzle:
	@echo "🌐 Opening Dozzle logs viewer..."
	@docker compose -f $(COMPOSE_FILE) up -d dozzle || true
	@echo "Dozzle available at: http://localhost:8888"

stop:
	@echo "⏹️  Stopping all containers..."
	@docker compose -f $(COMPOSE_FILE) stop

down:
	@echo "⬇️  Stopping and removing containers..."
	@docker compose -f $(COMPOSE_FILE) down

clean:
	@echo "🧹 Cleaning containers, images and volumes..."
	@docker compose -f $(COMPOSE_FILE) down -v --remove-orphans

restart:
	@echo "🔄 Restarting all containers..."
	@docker compose -f $(COMPOSE_FILE) restart

status:
	@echo "📊 Container status:"
	@docker compose -f $(COMPOSE_FILE) ps
############# Development Commands #############
tools:
	@echo "🔍 Running PHPStan analysis..."
	@docker compose -f $(COMPOSE_FILE) exec $(CONTAINER_NAME) vendor/bin/phpstan analyse src

cache:
	@echo "🗄️  Clearing Symfony cache..."
	@docker compose -f $(COMPOSE_FILE) exec -it $(CONTAINER_NAME) php bin/console cache:clear

############# Testing Commands #############
test:
	@echo "🧪 Running all tests..."
	@docker compose -f $(COMPOSE_FILE) exec $(CONTAINER_NAME) vendor/bin/pest --no-coverage

test-unit:
	@echo "🧪 Running unit tests..."
	@docker compose -f $(COMPOSE_FILE) exec $(CONTAINER_NAME) vendor/bin/pest --testsuite=Unit --no-coverage

test-feature:
	@echo "🧪 Running feature tests..."
	@docker compose -f $(COMPOSE_FILE) exec $(CONTAINER_NAME) vendor/bin/pest --testsuite=Feature --no-coverage

test-security:
	@echo "🧪 Running security tests..."
	@docker compose -f $(COMPOSE_FILE) exec $(CONTAINER_NAME) vendor/bin/pest --testsuite=Security --no-coverage

test-architecture:
	@echo "🧪 Running architecture tests..."
	@docker compose -f $(COMPOSE_FILE) exec $(CONTAINER_NAME) vendor/bin/pest --testsuite=Architecture --no-coverage

test-coverage:
	@echo "🧪 Running tests with code coverage..."
	@docker compose -f $(COMPOSE_FILE) exec $(CONTAINER_NAME) vendor/bin/pest --coverage --min=80

test-watch:
	@echo "🧪 Running tests in watch mode..."
	@docker compose -f $(COMPOSE_FILE) exec $(CONTAINER_NAME) vendor/bin/pest --watch

####################################

############# Database Commands #############
fixtures:
	@echo "📦 Loading Doctrine fixtures..."
	@docker compose -f $(COMPOSE_FILE) exec -it $(CONTAINER_NAME) php bin/console doctrine:fixtures:load --no-interaction

migration:
	@echo "📄 Creating new migration..."
	@docker compose -f $(COMPOSE_FILE) exec -it $(CONTAINER_NAME) php bin/console make:migration

migrate:
	@echo "🚀 Running database migrations..."
	@docker compose -f $(COMPOSE_FILE) exec -it $(CONTAINER_NAME) php bin/console doctrine:migrations:migrate --no-interaction

############# Security Commands #############
cleanup-tokens:
	@echo "🔒 Cleaning up expired refresh tokens..."
	@docker compose -f $(COMPOSE_FILE) exec -it $(CONTAINER_NAME) php bin/console app:cleanup-expired-tokens