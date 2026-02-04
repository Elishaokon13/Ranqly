@echo off
echo 🚀 Starting Ranqly Frontend Development Server...

REM Navigate to frontend directory
cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install --legacy-peer-deps
)

REM Start the development server
echo 🌐 Starting Vite development server on http://localhost:3000
call npm run dev
