# Joni Installation Guide

## Quick Install

### Method 1: One-Line Install (Recommended)

```bash
curl -fsSL https://joni.ai/install.sh | bash
```

This will:

- Check for Node.js (18+)
- Download Joni
- Install dependencies
- Build the project
- Install globally
- Guide you through setup

### Method 2: From Git Repository

```bash
# Clone the repo
git clone https://github.com/yourusername/joni.git
cd joni

# Run installer
./install.sh
```

### Method 3: Manual Install

```bash
# Clone
git clone https://github.com/yourusername/joni.git
cd joni

# Install dependencies
npm install

# Build
npm run build

# Install globally
npm install -g .
```

## Requirements

- **Node.js**: 18 or higher
- **Package Manager**: npm or pnpm
- **OS**: macOS, Linux, or Windows (WSL2)

## First Run

After installation, run the onboarding wizard:

```bash
joni onboard
```

This will guide you through:

1. Workspace setup
2. Channel configuration (Telegram, WhatsApp, etc.)
3. Agent preset selection
4. Crypto wallet setup (optional)

## Verify Installation

```bash
joni --version
```

Should output: `joni/2026.2.9`

## Update

To update Joni to the latest version:

```bash
curl -fsSL https://joni.ai/install.sh | bash
```

Or manually:

```bash
cd /path/to/joni
git pull
npm install
npm run build
npm install -g .
```

## Uninstall

```bash
npm uninstall -g joni
```

## Troubleshooting

### Command not found: joni

Make sure npm global bin is in your PATH:

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Permission errors on macOS/Linux

If you get EACCES errors:

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g .

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Node.js version too old

Install Node.js 18+:

**macOS:**

```bash
brew install node
```

**Linux:**

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

## Support

- **Issues**: https://github.com/yourusername/joni/issues
- **Discussions**: https://github.com/yourusername/joni/discussions
- **Documentation**: https://github.com/yourusername/joni/blob/main/README.md
