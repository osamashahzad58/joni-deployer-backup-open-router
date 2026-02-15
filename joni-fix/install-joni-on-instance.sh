#!/usr/bin/env bash
set -euo pipefail

# JONI install on an existing instance (Docker + repo already present).
# Use this on a machine that already has Docker, Docker Compose, and the JONI
# repo (and optionally the image already built).
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - JONI repo at JONI_DIR (default: ~/JONI)
#
# Usage:
#   Export API keys then run:
#     export ANTHROPIC_API_KEY=... GEMINI_API_KEY=... OPENAI_API_KEY=...
#     ./install-joni-on-instance.sh
#
#   Or run from a dir that has .env.joni (or pass path):
#     ./install-joni-on-instance.sh
#     ./install-joni-on-instance.sh /path/to/.env.joni
#
#   Optional:
#     JONI_DIR=/path/to/JONI ./install-joni-on-instance.sh
#     PUBLIC_IP=1.2.3.4 ./install-joni-on-instance.sh   # for gateway URL in output

JONI_DIR="${JONI_DIR:-$HOME/JONI}"
ENV_JONI_SOURCE="${1:-}"

if [[ ! -d "$JONI_DIR" ]]; then
  echo "❌ JONI directory not found: $JONI_DIR"
  echo "   Set JONI_DIR or clone the repo first, e.g.: git clone https://github.com/TokenTimes/JONI.git $JONI_DIR"
  exit 1
fi

# Load API keys: from argument path, or env, or existing .env.joni in JONI_DIR
if [[ -n "$ENV_JONI_SOURCE" && -f "$ENV_JONI_SOURCE" ]]; then
  source "$ENV_JONI_SOURCE"
  echo "✅ Loaded API keys from $ENV_JONI_SOURCE"
elif [[ -n "${ANTHROPIC_API_KEY:-}" && -n "${GEMINI_API_KEY:-}" && -n "${OPENAI_API_KEY:-}" ]]; then
  echo "✅ Using API keys from environment"
elif [[ -f "$JONI_DIR/.env.joni" ]]; then
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
echo "🚀 Running JONI Docker setup (build if needed, then start)..."
cd "$JONI_DIR"
chmod +x docker-setup.sh
if groups | grep -q docker; then
  ./docker-setup.sh
else
  sg docker -c './docker-setup.sh'
fi

GATEWAY_URL="http://${PUBLIC_IP:-$(hostname -f 2>/dev/null || echo 'localhost')}:18890"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ JONI deployment complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Quick commands:"
echo "  View logs:  docker compose -f $JONI_DIR/docker-compose.yml logs -f joni-gateway"
echo "  Chat:       docker compose -f $JONI_DIR/docker-compose.yml run --rm joni-cli"
echo "  Stop:       docker compose -f $JONI_DIR/docker-compose.yml down"
echo ""
echo "🌐 Gateway: $GATEWAY_URL"
echo ""
