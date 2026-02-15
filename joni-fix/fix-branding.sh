#!/bin/bash
# Fix user-facing OpenClaw strings to JONI

# Fix error messages and user-facing strings (not variable names)
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | xargs -0 sed -i '' \
  -e 's/"OpenClaw runs/"JONI runs/g' \
  -e 's/"OpenClaw is/"JONI is/g' \
  -e 's/"OpenClaw/"JONI/g' \
  -e "s/'OpenClaw/'JONI/g" \
  -e 's/openclaw onboard/joni onboard/g' \
  -e 's/openclaw doctor/joni doctor/g' \
  -e 's/openclaw gateway/joni gateway/g' \
  -e 's/openclaw configure/joni configure/g' \
  -e 's/openclaw security/joni security/g' \
  -e 's/openclaw status/joni status/g' \
  -e 's/openclaw completion/joni completion/g' \
  -e 's|docs\.openclaw\.ai|docs.joni.ai|g' \
  -e 's|https://openclaw\.ai|https://joni.ai|g'

echo "✅ Fixed user-facing strings"
