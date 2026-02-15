#!/bin/bash
set -e

echo "🔧 Fixing state directory from .openclaw to .joni..."

# Replace .openclaw with .joni in all source files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/\.openclaw/.joni/g' \
  -e 's/OPENCLAW_HOME/JONI_HOME/g' \
  -e 's/OPENCLAW_STATE_DIR/JONI_STATE_DIR/g' \
  -e 's/OPENCLAW_CONFIG_PATH/JONI_CONFIG_PATH/g' \
  -e 's/CLAWDBOT_STATE_DIR/JONI_STATE_DIR/g' \
  {} \;

# Fix environment variable references in docs
if [ -d docs ]; then
  find docs -type f \( -name "*.md" -o -name "*.mdx" \) -exec sed -i '' \
    -e 's/OPENCLAW_HOME/JONI_HOME/g' \
    -e 's/OPENCLAW_STATE_DIR/JONI_STATE_DIR/g' \
    -e 's/OPENCLAW_CONFIG_PATH/JONI_CONFIG_PATH/g' \
    -e 's/\.openclaw/.joni/g' \
    {} \;
fi

# Fix README
if [ -f README.md ]; then
  sed -i '' \
    -e 's/\.openclaw/.joni/g' \
    -e 's/OPENCLAW_HOME/JONI_HOME/g' \
    -e 's/OPENCLAW_STATE_DIR/JONI_STATE_DIR/g' \
    README.md
fi

echo "✅ State directory fixed: .openclaw → .joni"
echo "✅ Environment variables fixed: OPENCLAW_* → JONI_*"
