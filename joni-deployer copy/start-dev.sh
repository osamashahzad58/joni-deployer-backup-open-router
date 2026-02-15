#!/bin/bash

# JONI Deployer - Development Start Script
# Starts both backend API and frontend dev server

echo "🚀 Starting JONI Deployer Development Servers..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
fi

# Check if deployment script exists
SCRIPT_PATH="$HOME/.openclaw/workspace/deploy-joni-aws-final.sh"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "⚠️  Warning: Deployment script not found at $SCRIPT_PATH"
    echo "   The deployment will fail without this script."
    echo ""
fi

# Kill any existing processes on ports 3000, 3001, 3100
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000,3001,3100 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start backend in background
echo "🔧 Starting backend API server (port 3100)..."
cd server
node index.js &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! curl -s http://localhost:3100/api/health > /dev/null; then
    echo "❌ Backend failed to start on port 3100"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend running on http://localhost:3100"
echo ""

# Start frontend
echo "🎨 Starting frontend dev server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Open your browser to the URL shown below"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev

# Cleanup on exit
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID 2>/dev/null; exit 0" INT TERM EXIT
