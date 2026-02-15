#!/usr/bin/env bash
set -euo pipefail

# JONI install without Docker (Node + pnpm/npm on the host).
# Use this on a machine where you do not want or have Docker.
#
# Prerequisites:
#   - Node 22+
#   - pnpm or npm
#   - JONI repo at JONI_DIR (default: current dir if it's the repo, else ~/JONI)
#
# Usage:
#   From repo root with API keys in env:
#     export ANTHROPIC_API_KEY=... GEMINI_API_KEY=... OPENAI_API_KEY=...
#     ./install-joni-no-docker.sh
#
#   Or with .env.joni (in repo or pass path):
#     ./install-joni-no-docker.sh
#     ./install-joni-no-docker.sh /path/to/.env.joni
#
#   Optional:
#     JONI_DIR=/path/to/JONI ./install-joni-no-docker.sh
#     ./install-joni-no-docker.sh --no-install-daemon   # skip gateway service install

JONI_DIR="${JONI_DIR:-}"
ENV_JONI_SOURCE=""
INSTALL_DAEMON="--install-daemon"

for arg in "$@"; do
  if [[ "$arg" == "--no-install-daemon" ]]; then
    INSTALL_DAEMON=""
  elif [[ -z "$ENV_JONI_SOURCE" && "$arg" != --* ]]; then
    ENV_JONI_SOURCE="$arg"
  fi
done

# Resolve JONI_DIR: explicit, or current dir if repo, else ~/JONI
if [[ -z "$JONI_DIR" ]]; then
  if [[ -f "package.json" && -f "joni.mjs" ]]; then
    JONI_DIR="$(pwd)"
  else
    JONI_DIR="$HOME/JONI"
  fi
fi

if [[ ! -d "$JONI_DIR" ]]; then
  echo "❌ JONI directory not found: $JONI_DIR"
  echo "   Clone the repo first, e.g.: git clone https://github.com/TokenTimes/JONI.git $JONI_DIR"
  exit 1
fi

if [[ ! -f "$JONI_DIR/package.json" ]]; then
  echo "❌ Not a JONI repo (no package.json): $JONI_DIR"
  exit 1
fi

# Node 22+
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install Node 22+ first."
  exit 1
fi
NODE_MAJOR=$(node -v | sed -n 's/^v\([0-9]*\).*/\1/p')
if [[ -z "$NODE_MAJOR" || "$NODE_MAJOR" -lt 22 ]]; then
  echo "❌ Node 22+ required (you have $(node -v))"
  exit 1
fi
echo "✅ Node $(node -v)"

# Install pnpm if missing (for deps + build; global CLI install uses npm to avoid pnpm global-bin-dir)
if ! command -v pnpm &>/dev/null; then
  echo "📦 Installing pnpm..."
  if command -v corepack &>/dev/null; then
    corepack enable
    corepack prepare pnpm@latest --activate
  else
    npm install -g pnpm
  fi
  PATH="$HOME/.local/share/pnpm:$(npm prefix -g 2>/dev/null)/bin:$PATH"
  export PATH
fi
if command -v pnpm &>/dev/null; then
  PKG_MANAGER="pnpm"
else
  PKG_MANAGER="npm"
fi
echo "✅ Using $PKG_MANAGER for deps/build; npm for global CLI"

# Load API keys: from argument path, or env, or existing .env.joni in JONI_DIR
if [[ -n "$ENV_JONI_SOURCE" && -f "$ENV_JONI_SOURCE" ]]; then
  # shellcheck source=/dev/null
  source "$ENV_JONI_SOURCE"
  echo "✅ Loaded API keys from $ENV_JONI_SOURCE"
elif [[ -n "${ANTHROPIC_API_KEY:-}" && -n "${GEMINI_API_KEY:-}" && -n "${OPENAI_API_KEY:-}" ]]; then
  echo "✅ Using API keys from environment"
elif [[ -f "$JONI_DIR/.env.joni" ]]; then
  # shellcheck source=/dev/null
  source "$JONI_DIR/.env.joni"
  echo "✅ Using existing $JONI_DIR/.env.joni"
else
  echo "❌ API keys not found."
  echo "   Either:"
  echo "     1. export ANTHROPIC_API_KEY=... GEMINI_API_KEY=... OPENAI_API_KEY=..."
  echo "     2. Create $JONI_DIR/.env.joni with those variables"
  echo "     3. Run with: $0 /path/to/.env.joni"
  exit 1
fi

if [[ -z "${ANTHROPIC_API_KEY:-}" || -z "${GEMINI_API_KEY:-}" || -z "${OPENAI_API_KEY:-}" ]]; then
  echo "❌ Missing one or more of: ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY"
  exit 1
fi

echo ""
echo "🔑 Writing .env.joni to $JONI_DIR..."
tmp_env=$(mktemp)
printf 'ANTHROPIC_API_KEY=%s\n' "$ANTHROPIC_API_KEY" >> "$tmp_env"
printf 'GEMINI_API_KEY=%s\n' "$GEMINI_API_KEY" >> "$tmp_env"
printf 'OPENAI_API_KEY=%s\n' "$OPENAI_API_KEY" >> "$tmp_env"
mv "$tmp_env" "$JONI_DIR/.env.joni"
echo "✅ .env.joni created"

echo ""
echo "📦 Installing dependencies..."
cd "$JONI_DIR"
if [[ "$PKG_MANAGER" == "pnpm" ]]; then
  pnpm install
else
  npm install
fi

echo ""
echo "🔨 Building JONI..."
if [[ "$PKG_MANAGER" == "pnpm" ]]; then
  pnpm run build
else
  npm run build
fi

echo ""
echo "🌍 Installing JONI CLI globally (npm so it works without pnpm global-bin-dir)..."
npm install -g .

echo ""
echo "📋 Running onboarding (non-interactive)..."
joni onboard \
  --non-interactive \
  --accept-risk \
  --flow quickstart \
  --mode local \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --skip-channels \
  --skip-health \
  $INSTALL_DAEMON

GATEWAY_PORT="${JONI_GATEWAY_PORT:-18890}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ JONI installed (no Docker)!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Quick commands:"
echo "  Start gateway:  joni gateway start"
echo "  Chat:           joni"
echo "  Status:         joni gateway status"
echo "  Stop gateway:   joni gateway stop"
echo ""
echo "🌐 Gateway: http://localhost:$GATEWAY_PORT"
echo ""
