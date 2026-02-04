@echo off
echo 🐳 Starting Ranqly Frontend with Docker...

REM Build and start the frontend container
echo 🔨 Building and starting frontend container...
docker-compose -f docker-compose.frontend.yml up --build frontend-dev

echo 🌐 Frontend should be available at http://localhost:3000
