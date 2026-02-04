#!/bin/bash

# Start Frontend Development Server
echo "🚀 Starting Ranqly Frontend Development Server..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Start the development server
echo "🌐 Starting Vite development server on http://localhost:3000"
npm run dev
