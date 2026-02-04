#!/bin/bash

# Ranqly Development Environment Startup Script
set -e

echo "🚀 Starting Ranqly Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/prometheus
mkdir -p data/grafana

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp env.example .env
    print_warning "Please update .env file with your configuration before continuing."
fi

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose pull

# Build services
print_status "Building services..."
docker-compose build

# Start infrastructure services first
print_status "Starting infrastructure services (PostgreSQL, Redis)..."
docker-compose up -d postgres redis

# Wait for database to be ready
print_status "Waiting for database to be ready..."
timeout=60
while ! docker-compose exec postgres pg_isready -U ranqly -d ranqly_dev > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        print_error "Database failed to start within 60 seconds"
        exit 1
    fi
    sleep 1
done

# Wait for Redis to be ready
print_status "Waiting for Redis to be ready..."
timeout=30
while ! docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        print_error "Redis failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

print_success "Infrastructure services are ready!"

# Start application services
print_status "Starting application services..."
docker-compose up -d api-gateway voting-engine algo-engine notification-service

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Start frontend
print_status "Starting frontend..."
docker-compose up -d frontend

# Start monitoring services
print_status "Starting monitoring services..."
docker-compose up -d prometheus grafana

# Wait for all services to be ready
print_status "Waiting for all services to be ready..."
sleep 15

# Check service health
print_status "Checking service health..."

services=("api-gateway:8000" "voting-engine:8002" "algo-engine:8001" "notification-service:8003" "frontend:80")
all_healthy=true

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        print_success "$name is healthy"
    else
        print_error "$name is not responding"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    print_success "All services are healthy!"
else
    print_warning "Some services may not be fully ready yet. Check logs with: docker-compose logs [service-name]"
fi

# Display service URLs
echo ""
echo "🌐 Service URLs:"
echo "  Frontend:          http://localhost:3000"
echo "  API Gateway:       http://localhost:8000"
echo "  API Documentation: http://localhost:8000/docs"
echo "  Voting Engine:     http://localhost:8002"
echo "  Algorithm Engine:  http://localhost:8001"
echo "  Notification API:  http://localhost:8003"
echo "  Prometheus:        http://localhost:9090"
echo "  Grafana:           http://localhost:3001 (admin/admin)"
echo ""

# Display useful commands
echo "🔧 Useful Commands:"
echo "  View logs:         docker-compose logs -f [service-name]"
echo "  Stop services:     docker-compose down"
echo "  Restart service:   docker-compose restart [service-name]"
echo "  View all services: docker-compose ps"
echo ""

print_success "Ranqly development environment is ready!"
print_status "You can now start developing. Happy coding! 🎉"
