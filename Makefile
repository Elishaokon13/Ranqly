# Ranqly Development Makefile

.PHONY: help dev build clean test lint install-deps

# Default target
help:
	@echo "Ranqly Development Commands:"
	@echo "  dev          - Start development environment"
	@echo "  build        - Build all services"
	@echo "  clean        - Clean Docker containers and images"
	@echo "  test         - Run tests"
	@echo "  lint         - Run linting"
	@echo "  install-deps - Install dependencies for all services"
	@echo "  logs         - Show logs from all services"
	@echo "  stop         - Stop all services"
	@echo "  restart      - Restart all services"

# Development environment
dev:
	@echo "Starting Ranqly development environment..."
	docker-compose -f deployment/docker/docker-compose.dev.yml up --build

# Build all services
build:
	@echo "Building all services..."
	docker-compose -f deployment/docker/docker-compose.dev.yml build

# Clean Docker resources
clean:
	@echo "Cleaning Docker resources..."
	docker-compose -f deployment/docker/docker-compose.dev.yml down -v
	docker system prune -f

# Run tests
test:
	@echo "Running tests..."
	# Add test commands here

# Run linting
lint:
	@echo "Running linting..."
	# Add lint commands here

# Install dependencies
install-deps:
	@echo "Installing dependencies..."
	cd services/api-gateway && npm install
	cd services/voting-engine && npm install
	cd services/algo-engine && pip install -r requirements.txt
	cd frontend && npm install

# Show logs
logs:
	docker-compose -f deployment/docker/docker-compose.dev.yml logs -f

# Stop services
stop:
	docker-compose -f deployment/docker/docker-compose.dev.yml down

# Restart services
restart: stop dev

# Database operations
db-reset:
	@echo "Resetting database..."
	docker-compose -f deployment/docker/docker-compose.dev.yml exec postgres psql -U ranqly -d ranqly_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	docker-compose -f deployment/docker/docker-compose.dev.yml exec postgres psql -U ranqly -d ranqly_dev -f /docker-entrypoint-initdb.d/init-db.sql

# Health check
health:
	@echo "Checking service health..."
	@curl -s http://localhost:8000/health || echo "API Gateway not responding"
	@curl -s http://localhost:8001/health || echo "Algo Engine not responding"
	@curl -s http://localhost:8002/health || echo "Voting Engine not responding"
	@curl -s http://localhost:3000/health || echo "Frontend not responding"

# Setup development environment
setup: install-deps
	@echo "Setting up development environment..."
	docker-compose -f deployment/docker/docker-compose.dev.yml up -d postgres redis mongodb rabbitmq ipfs
	@echo "Waiting for services to be ready..."
	sleep 10
	@echo "Development environment ready!"