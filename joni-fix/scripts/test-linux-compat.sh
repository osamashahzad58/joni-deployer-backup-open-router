#!/usr/bin/env bash
# Linux Compatibility Test Script
# Run this on Ubuntu/Debian to verify Joni compatibility

set -e

echo "🐧 Joni Linux Compatibility Test"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

check() {
    local test_name="$1"
    local command="$2"
    
    echo -n "Testing: $test_name... "
    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
    fi
}

echo "📋 System Information"
echo "--------------------"
echo "OS: $(uname -s)"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Distribution: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || echo 'Unknown')"
echo ""

echo "📋 Prerequisites"
echo "----------------"
check "Node.js installed" "command -v node"
check "Node.js version >= 18" "[ \$(node -v | cut -d'v' -f2 | cut -d'.' -f1) -ge 18 ]"
check "npm installed" "command -v npm"
check "Git installed" "command -v git"
echo ""

echo "📋 System Capabilities"
echo "----------------------"
check "systemd available" "command -v systemctl"
check "systemd user services" "systemctl --user status > /dev/null 2>&1; [ \$? -ne 127 ]"
check "XDG_RUNTIME_DIR set" "[ -n \"\$XDG_RUNTIME_DIR\" ]"
check "User home directory writable" "[ -w \"\$HOME\" ]"
check "Can create ~/.joni directory" "mkdir -p \"\$HOME/.joni\" && [ -d \"\$HOME/.joni\" ]"
echo ""

echo "📋 Network"
echo "----------"
check "Can resolve DNS" "ping -c 1 google.com > /dev/null 2>&1"
check "Can access GitHub" "curl -s https://github.com > /dev/null 2>&1"
echo ""

echo "📋 Optional (recommended)"
echo "------------------------"
check "pnpm installed" "command -v pnpm"
check "systemd linger enabled" "loginctl show-user \$USER 2>/dev/null | grep -q 'Linger=yes'"
echo ""

echo "=================================="
echo "Results:"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Your system is ready for Joni!${NC}"
    echo ""
    echo "Install Joni with:"
    echo "  curl -fsSL https://raw.githubusercontent.com/satoshimoltnakamoto-eng/JONI/main/install.sh | bash"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some checks failed. Review the failures above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Install Node.js: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  - Install Git: sudo apt-get install -y git"
    echo "  - Enable systemd linger: loginctl enable-linger \$USER"
    echo "  - Set XDG_RUNTIME_DIR: export XDG_RUNTIME_DIR=/run/user/\$(id -u)"
    exit 1
fi
