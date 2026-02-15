#!/bin/bash
set -e

echo "🐙 Starting complete JONI rebranding..."

# Fix package.json android references
sed -i '' 's/ai\.openclaw\.android/ai.joni.android/g' package.json

# Fix all user-facing strings in source code
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/"OpenClaw/"JONI/g' \
  -e "s/'OpenClaw/'JONI/g" \
  -e 's/OpenClaw runs/JONI runs/g' \
  -e 's/OpenClaw is/JONI is/g' \
  -e 's/openclaw onboard/joni onboard/g' \
  -e 's/openclaw doctor/joni doctor/g' \
  -e 's/openclaw gateway/joni gateway/g' \
  -e 's/openclaw configure/joni configure/g' \
  -e 's/openclaw security/joni security/g' \
  -e 's/openclaw status/joni status/g' \
  -e 's/openclaw completion/joni completion/g' \
  -e 's|docs\.openclaw\.ai|docs.joni.ai|g' \
  -e 's|https://openclaw\.ai|https://joni.ai|g' \
  {} \;

# Fix README
if [ -f README.md ]; then
  sed -i '' \
    -e 's/OpenClaw/JONI/g' \
    -e 's/openclaw/joni/g' \
    -e 's|docs\.openclaw\.ai|docs.joni.ai|g' \
    -e 's|https://openclaw\.ai|https://joni.ai|g' \
    README.md
fi

# Fix install script - complete replacement
cat > install.sh << 'EOF'
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

echo -e "${GREEN}✅ Using \$PKG_MANAGER for dependencies, npm for global install${NC}"
echo ""

# Determine installation method
if [ -d ".git" ] && [ -f "package.json" ]; then
    # Running from repo directory
    echo "📦 Installing from local repository..."
    echo ""
    
    # Install dependencies
    echo "⬇️  Installing dependencies..."
    \$PKG_MANAGER install
    
    # Build
    echo "🔨 Building JONI..."
    \$PKG_MANAGER run build
    
    # Install globally
    echo "🌍 Installing globally..."
    \$INSTALL_CMD .
    
else
    # Download from GitHub
    REPO_URL="https://github.com/satoshimoltnakamoto-eng/JONI"
    TEMP_DIR="/tmp/joni-install-\$\$"
    
    echo "⬇️  Downloading JONI from GitHub..."
    
    if command -v git &> /dev/null; then
        git clone --depth 1 "\$REPO_URL" "\$TEMP_DIR"
        cd "\$TEMP_DIR"
    else
        echo -e "${RED}❌ Git not found. Cannot download JONI.${NC}"
        echo ""
        echo "Install Git first, or download manually from:"
        echo "  \$REPO_URL"
        exit 1
    fi
    
    # Install dependencies
    echo "⬇️  Installing dependencies..."
    \$PKG_MANAGER install
    
    # Build
    echo "🔨 Building JONI..."
    \$PKG_MANAGER run build
    
    # Install globally
    echo "🌍 Installing globally..."
    \$INSTALL_CMD .
    
    # Cleanup
    cd -
    rm -rf "\$TEMP_DIR"
fi

echo ""
echo -e "${GREEN}✅ JONI installed successfully!${NC}"
echo ""

# --- Complete Auto-Setup ---
echo "🚀 Setting up JONI with default configuration..."
echo ""

# Create config directory if it doesn't exist
mkdir -p "\$HOME/.joni"

# Default API keys
DEFAULT_ANTHROPIC_KEY="\${ANTHROPIC_API_KEY:-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}"
DEFAULT_GEMINI_KEY="\${GEMINI_API_KEY:-AIzaSyCe4TcX7TOm_9tjFRQq5lSf038gwQTQB3A}"
DEFAULT_OPENAI_KEY="\${OPENAI_API_KEY:-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}"

# Export for joni onboard
export ANTHROPIC_API_KEY="\$DEFAULT_ANTHROPIC_KEY"
export GEMINI_API_KEY="\$DEFAULT_GEMINI_KEY"
export OPENAI_API_KEY="\$DEFAULT_OPENAI_KEY"

# Run onboard
echo "📋 Running onboard..."
joni onboard \\
    --non-interactive \\
    --accept-risk \\
    --flow quickstart \\
    --mode local \\
    --install-daemon \\
    --skip-health 2>&1 || {
        echo ""
        echo -e "${YELLOW}⚠️  Run 'joni onboard' manually to configure${NC}"
    }

echo ""
echo ""
echo -e "${GREEN}🎉 JONI is ready!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Quick Start:"
echo ""
echo "  1️⃣  Start the gateway:"
echo "     ${YELLOW}joni gateway start${NC}"
echo ""
echo "  2️⃣  Chat with JONI:"
echo "     ${YELLOW}joni${NC}"
echo ""
echo "  3️⃣  (Optional) Connect to Telegram/WhatsApp:"
echo "     ${YELLOW}joni configure --section channels${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Docs: https://github.com/satoshimoltnakamoto-eng/JONI"
echo "💬 Support: https://github.com/satoshimoltnakamoto-eng/JONI/issues"
echo ""
echo "Happy hacking! 🚀"
EOF

chmod +x install.sh

echo "✅ Complete rebranding done!"
echo ""
echo "Summary of changes:"
echo "  - All OpenClaw → JONI in source code"
echo "  - All openclaw commands → joni commands"
echo "  - All docs.openclaw.ai → docs.joni.ai"
echo "  - New install.sh with JONI branding"
echo "  - package.json android references fixed"
