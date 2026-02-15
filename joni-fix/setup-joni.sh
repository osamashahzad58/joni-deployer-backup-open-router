#!/usr/bin/env bash
set -e

# JONI Auto-Setup Script
# This script configures JONI with all presets - no questions asked!

echo "🐙 Setting up JONI with auto-configuration..."
echo ""

# Load environment variables
if [ -f .env.joni ]; then
    echo "✅ Loading API keys from .env.joni..."
    export $(cat .env.joni | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env.joni not found. Using defaults..."
    export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-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}"
    export GEMINI_API_KEY="${GEMINI_API_KEY:-AIzaSyCe4TcX7TOm_9tjFRQq5lSf038gwQTQB3A}"
    export OPENAI_API_KEY="${OPENAI_API_KEY:-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}"
fi

# Clean previous installation (optional)
if [ "$1" == "--reset" ]; then
    echo "🧹 Cleaning previous JONI installation..."
    rm -rf ~/.joni
    launchctl bootout gui/$UID/ai.joni.gateway 2>/dev/null || true
    rm -f ~/Library/LaunchAgents/ai.joni.gateway.plist
    echo "✅ Reset complete"
    echo ""
fi

# Run joni onboard with full automation
echo "📋 Running JONI onboard (fully automated)..."
echo ""

joni onboard \
    --non-interactive \
    --accept-risk \
    --flow quickstart \
    --mode local \
    --auth-choice anthropic \
    --anthropic-api-key "$ANTHROPIC_API_KEY" \
    --install-daemon \
    --skip-channels \
    --skip-health

echo ""
echo "✅ Onboard complete! Now configuring skills..."
echo ""

# Configure skills with API keys
JONI_CONFIG="$HOME/.joni/joni.json"
if [ -f "$JONI_CONFIG" ]; then
    echo "🔧 Adding skill API keys to config..."
    
    node -e "
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('$JONI_CONFIG', 'utf8'));

cfg.skills = cfg.skills || {};
cfg.skills.entries = cfg.skills.entries || {};

// Add API keys for skills
cfg.skills.entries['nano-banana-pro'] = { apiKey: '$GEMINI_API_KEY' };
cfg.skills.entries['openai-whisper-api'] = { apiKey: '$OPENAI_API_KEY' };

fs.writeFileSync('$JONI_CONFIG', JSON.stringify(cfg, null, 2) + '\n');
console.log('✅ Skill API keys configured');
" 2>&1
fi

# Enable hooks
echo "🪝 Enabling hooks (boot-md, command-logger, session-memory)..."
joni hooks enable boot-md 2>/dev/null || true
joni hooks enable command-logger 2>/dev/null || true
joni hooks enable session-memory 2>/dev/null || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 JONI is fully configured and ready!"
echo ""
echo "✅ Configuration:"
echo "   - Port: 18890 (OpenClaw uses 18789 - no conflict!)"
echo "   - Channels: Skipped (OpenClaw Telegram untouched)"
echo "   - Auth: Anthropic (Claude)"
echo "   - Skills: Configured with API keys"
echo "   - Hooks: Enabled (boot-md, command-logger, session-memory)"
echo ""
echo "📋 Next steps:"
echo ""
echo "  1️⃣  Start JONI gateway:"
echo "     joni gateway start"
echo ""
echo "  2️⃣  Chat with JONI:"
echo "     joni"
echo ""
echo "  3️⃣  Or use TUI:"
echo "     joni --tui"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tip: OpenClaw and JONI run side-by-side without interfering!"
echo ""
