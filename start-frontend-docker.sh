#!/bin/bash

# Start Frontend with Docker
echo "🐳 Starting Ranqly Frontend with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start the frontend container
echo "🔨 Building and starting frontend container..."
docker-compose -f docker-compose.frontend.yml up --build frontend-dev

echo "🌐 Frontend should be available at http://localhost:3000"
