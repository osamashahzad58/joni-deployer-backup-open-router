#!/usr/bin/env bash
set -euo pipefail

# Install JONI then run the full interactive onboarding wizard.
# No presets: you answer every question from first to last (flow = advanced).
#
# Usage:
#   ./install-joni-manual.sh
#
# Prerequisites: Node 18+ (recommend 22+), git if installing from GitHub.
# Optional: set JONI_DIR to install from a local repo; otherwise uses install.sh logic.

echo "🐙 JONI — install + full manual onboarding (no presets)"
echo ""

# --- Install step ---
if [[ -n "${JONI_DIR:-}" && -d "$JONI_DIR" && -f "$JONI_DIR/package.json" ]]; then
  echo "📦 Installing from local repo: $JONI_DIR"
  cd "$JONI_DIR"
  if command -v pnpm &>/dev/null; then
    pnpm install && pnpm run build
  else
    npm install && npm run build
  fi
  npm install -g .
  cd - >/dev/null
elif [[ -d ".git" && -f "package.json" ]]; then
  echo "📦 Installing from current repo..."
  if command -v pnpm &>/dev/null; then
    pnpm install && pnpm run build
  else
    npm install && npm run build
  fi
  npm install -g .
else
  echo "📦 Installing from GitHub..."
  TEMP_DIR="/tmp/joni-install-$$"
  REPO_URL="${JONI_REPO_URL:-https://github.com/satoshimoltnakamoto-eng/JONI}"
  git clone --depth 1 "$REPO_URL" "$TEMP_DIR"
  cd "$TEMP_DIR"
  if command -v pnpm &>/dev/null; then
    pnpm install && pnpm run build
  else
    npm install && npm run build
  fi
  npm install -g .
  cd - >/dev/null
  rm -rf "$TEMP_DIR"
fi

echo ""
echo "✅ JONI installed. Starting full interactive onboarding (no presets)..."
echo "   You will be prompted for every option from first to last."
echo ""

# Full interactive wizard, advanced flow = all options, no preset choices
exec joni onboard --flow advanced
