#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🐙 JONI Deployer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if deployment script exists
SCRIPT_PATH="$HOME/.openclaw/workspace/deploy-joni-aws-final.sh"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "⚠️  Warning: Deployment script not found at:"
    echo "   $SCRIPT_PATH"
    echo ""
    echo "   Running in DEMO mode only."
    echo ""
fi

echo "🚀 Starting JONI Deployer server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Server: http://localhost:3000"
echo "🌐 Opening browser..."
echo ""
echo "   Press Ctrl+C to stop"
echo ""

# Start server
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Open browser
open "http://localhost:3000"

# Wait for server
wait $SERVER_PID
