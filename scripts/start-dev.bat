@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting Ranqly Development Environment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose and try again.
    exit /b 1
)

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist logs mkdir logs
if not exist data\postgres mkdir data\postgres
if not exist data\redis mkdir data\redis
if not exist data\prometheus mkdir data\prometheus
if not exist data\grafana mkdir data\grafana

REM Copy environment file if it doesn't exist
if not exist .env (
    echo [INFO] Creating .env file from template...
    copy env.example .env
    echo [WARNING] Please update .env file with your configuration before continuing.
)

REM Pull latest images
echo [INFO] Pulling latest Docker images...
docker-compose pull

REM Build services
echo [INFO] Building services...
docker-compose build

REM Start infrastructure services first
echo [INFO] Starting infrastructure services (PostgreSQL, Redis)...
docker-compose up -d postgres redis

REM Wait for database to be ready
echo [INFO] Waiting for database to be ready...
timeout 60 >nul
:wait_db
docker-compose exec postgres pg_isready -U ranqly -d ranqly_dev >nul 2>&1
if errorlevel 1 (
    timeout 1 >nul
    goto wait_db
)

REM Wait for Redis to be ready
echo [INFO] Waiting for Redis to be ready...
timeout 30 >nul
:wait_redis
docker-compose exec redis redis-cli ping >nul 2>&1
if errorlevel 1 (
    timeout 1 >nul
    goto wait_redis
)

echo [SUCCESS] Infrastructure services are ready!

REM Start application services
echo [INFO] Starting application services...
docker-compose up -d api-gateway voting-engine algo-engine notification-service

REM Wait for services to be healthy
echo [INFO] Waiting for services to be healthy...
timeout 10 >nul

REM Start frontend
echo [INFO] Starting frontend...
docker-compose up -d frontend

REM Start monitoring services
echo [INFO] Starting monitoring services...
docker-compose up -d prometheus grafana

REM Wait for all services to be ready
echo [INFO] Waiting for all services to be ready...
timeout 15 >nul

REM Display service URLs
echo.
echo 🌐 Service URLs:
echo   Frontend:          http://localhost:3000
echo   API Gateway:       http://localhost:8000
echo   API Documentation: http://localhost:8000/docs
echo   Voting Engine:     http://localhost:8002
echo   Algorithm Engine:  http://localhost:8001
echo   Notification API:  http://localhost:8003
echo   Prometheus:        http://localhost:9090
echo   Grafana:           http://localhost:3001 (admin/admin)
echo.

REM Display useful commands
echo 🔧 Useful Commands:
echo   View logs:         docker-compose logs -f [service-name]
echo   Stop services:     docker-compose down
echo   Restart service:   docker-compose restart [service-name]
echo   View all services: docker-compose ps
echo.

echo [SUCCESS] Ranqly development environment is ready!
echo [INFO] You can now start developing. Happy coding! 🎉

pause
