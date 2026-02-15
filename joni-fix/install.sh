#!/usr/bin/env bash
set -e

# JONI Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/satoshimoltnakamoto-eng/JONI/main/install.sh | bash

echo "🐙 Installing JONI - Autonomous AI Agent Platform"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo ""
    echo "Install Node.js 18+ first:"
    echo ""
    echo "  macOS:   brew install node"
    echo ""
    echo "  Ubuntu/Debian:"
    echo "    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "    sudo apt-get install -y nodejs"
    echo ""
    echo "  RHEL/Amazon Linux:"
    echo "    sudo dnf install nodejs"
    echo ""
    echo "  Generic (nvm):"
    echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    echo "    nvm install 20"
    echo ""
    echo "  Windows: Use WSL2 + Ubuntu, then follow Ubuntu instructions"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required (you have $(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# Check for package manager
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    echo -e "${RED}❌ No package manager found${NC}"
    exit 1
fi

# Always use npm for global installation
if command -v npm &> /dev/null; then
    INSTALL_CMD="npm install -g"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using $PKG_MANAGER for dependencies, npm for global install${NC}"
echo ""

# Determine installation method
if [ -d ".git" ] && [ -f "package.json" ]; then
    # Running from repo directory
    echo "📦 Installing from local repository (no git download)..."
    echo ""
    
    # Install dependencies
    echo "⬇️  Installing dependencies..."
    $PKG_MANAGER install
    
    # Build
    echo "🔨 Building JONI..."
    $PKG_MANAGER run build
    
    # Install globally
    echo "🌍 Installing globally..."
    $INSTALL_CMD .
    
else
    # Download from GitHub
    REPO_URL="https://github.com/satoshimoltnakamoto-eng/JONI"
    TEMP_DIR="/tmp/joni-install-$$"
    
    echo "⬇️  Downloading JONI from GitHub..."
    
    if command -v git &> /dev/null; then
        git clone --depth 1 "$REPO_URL" "$TEMP_DIR"
        cd "$TEMP_DIR"
    else
        echo -e "${RED}❌ Git not found. Cannot download JONI.${NC}"
        echo ""
        echo "Install Git first, or download manually from:"
        echo "  $REPO_URL"
        exit 1
    fi
    
    # Install dependencies
    echo "⬇️  Installing dependencies..."
    $PKG_MANAGER install
    
    # Build
    echo "🔨 Building JONI..."
    $PKG_MANAGER run build
    
    # Install globally
    echo "🌍 Installing globally..."
    $INSTALL_CMD .
    
    # Cleanup
    cd -
    rm -rf "$TEMP_DIR"
fi

echo ""
echo -e "${GREEN}✅ JONI installed successfully!${NC}"
echo ""
echo -e "${GREEN}🎉 Installation complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "  1️⃣  Quick auto-setup (recommended):"
echo "     ${YELLOW}./setup-joni.sh${NC}"
echo ""
echo "     Or manual configuration:"
echo "     ${YELLOW}joni onboard${NC}"
echo ""
echo "  2️⃣  Start the gateway:"
echo "     ${YELLOW}joni gateway start${NC}"
echo ""
echo "  3️⃣  Chat with JONI:"
echo "     ${YELLOW}joni${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Docs: https://github.com/satoshimoltnakamoto-eng/JONI"
echo "💬 Support: https://github.com/satoshimoltnakamoto-eng/JONI/issues"
echo ""
echo "Happy hacking! 🚀"

# Optional: Auto-run onboard with defaults
# Uncomment the next lines to auto-configure after install
# export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-your-key-here}"
# joni onboard --non-interactive --accept-risk --flow quickstart --mode local --install-daemon
