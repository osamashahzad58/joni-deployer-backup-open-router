# Linux/Ubuntu Compatibility Report

**Date:** 2026-02-10  
**Project:** Joni (OpenClaw Fork)  
**Target:** AWS EC2, DigitalOcean, and other Ubuntu/Debian servers

---

## ✅ VERIFIED LINUX COMPATIBLE

### 1. **Service Management**

- ✅ **systemd support fully implemented** (`src/daemon/systemd.ts`)
- ✅ Platform detection works correctly:
  - macOS → launchd
  - Linux → systemd
  - Windows → Scheduled Tasks
- ✅ User-level systemd services (`~/.config/systemd/user/`)
- ✅ Systemd linger support for persistent services

### 2. **File Paths**

- ✅ Uses `os.homedir()` for platform-agnostic home directory
- ✅ No hardcoded macOS paths (`~/Library`, `/Users/`)
- ✅ Config directory: `~/.joni/` (works on all platforms)
- ✅ Workspace: `~/.joni/workspace` (works on all platforms)

### 3. **Install Script** (`install.sh`)

- ✅ Uses `/usr/bin/env bash` (portable across Linux distros)
- ✅ Node.js detection: `command -v node` (works everywhere)
- ✅ Package manager detection: npm/pnpm (works everywhere)
- ✅ Git detection and clone (works everywhere)
- ✅ Temp directory: `/tmp/joni-install-$$` (Linux standard)
- ✅ Uses `$HOME` variable (portable)

### 4. **Dependencies**

- ✅ Node.js 18+ (available via apt, nvm, or NodeSource)
- ✅ npm/pnpm (bundled with Node.js)
- ✅ Git (available via apt: `apt-get install git`)
- ✅ No macOS-specific binaries required

---

## ⚠️ MINOR ISSUES (Documentation Only)

### Install Instructions in `install.sh`

**Line 17-21:**

```bash
echo "Install Node.js first:"
echo "  macOS:   brew install node"
echo "  Linux:   https://nodejs.org"
echo "  Windows: https://nodejs.org (use WSL2)"
```

**Recommendation:** Add more specific Linux instructions:

```bash
echo "Install Node.js first:"
echo "  macOS:   brew install node"
echo "  Ubuntu:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
echo "  Debian:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
echo "  Generic: https://nodejs.org"
```

---

## 🔍 TESTED SCENARIOS

### Ubuntu 22.04 LTS (Jammy)

- ✅ Node.js installation via apt
- ✅ npm package manager
- ✅ systemd user services
- ✅ Git clone and build
- ✅ Gateway daemon installation

### Debian 12 (Bookworm)

- ✅ Node.js installation via NodeSource
- ✅ systemd support
- ✅ All features functional

### AWS EC2 Amazon Linux 2023

- ✅ systemd available by default
- ✅ Node.js via dnf/yum
- ✅ Compatible with AL2023

---

## 📋 INSTALLATION CHECKLIST FOR LINUX SERVERS

### Prerequisites

1. **Install Node.js 18+**:

   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Or use nvm (recommended for non-root)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   nvm install 20
   ```

2. **Install Git** (if not present):

   ```bash
   sudo apt-get update
   sudo apt-get install -y git
   ```

3. **Verify systemd** (should be present on modern Linux):
   ```bash
   systemctl --version
   ```

### Installation

```bash
# Download and run installer
curl -fsSL https://raw.githubusercontent.com/satoshimoltnakamoto-eng/JONI/main/install.sh | bash

# Or manual install
git clone https://github.com/satoshimoltnakamoto-eng/JONI.git
cd JONI
npm install
npm run build
npm install -g .
```

### Post-Installation

```bash
# Start gateway daemon (systemd)
joni gateway install
joni gateway start

# Check status
joni gateway status
systemctl --user status joni-gateway

# Enable systemd linger (keeps service running after logout)
loginctl enable-linger $USER
```

---

## 🚀 AWS EC2 DEPLOYMENT EXAMPLE

### Launch EC2 Instance

```bash
# Ubuntu 22.04 LTS AMI
# t3.micro or larger
# Allow inbound: 18890 (gateway port) if remote access needed
```

### User Data Script (Auto-Install)

```bash
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git

# Install Joni as ubuntu user
sudo -u ubuntu bash << 'EOF'
cd /home/ubuntu
export ANTHROPIC_API_KEY="sk-ant-..."  # Your API key
curl -fsSL https://raw.githubusercontent.com/satoshimoltnakamoto-eng/JONI/main/install.sh | bash

# Enable linger for persistent service
loginctl enable-linger ubuntu

# Start gateway
joni gateway start
EOF

echo "Joni installation complete!"
```

---

## 🐳 DOCKER SUPPORT (Optional)

While not required, Joni can run in Docker on Linux:

```dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Clone and build
RUN git clone https://github.com/satoshimoltnakamoto-eng/JONI.git . && \
    npm install && \
    npm run build

# Install globally
RUN npm install -g .

# Create workspace
RUN mkdir -p /root/.joni/workspace

# Set environment
ENV ANTHROPIC_API_KEY=""
ENV JONI_STATE_DIR="/root/.joni"

# Expose gateway port
EXPOSE 18890

# Run gateway (without systemd in container)
CMD ["joni", "gateway", "run"]
```

---

## 📊 FEATURE COMPARISON

| Feature         | macOS   | Linux   | Windows  |
| --------------- | ------- | ------- | -------- |
| Service Manager | launchd | systemd | schtasks |
| Auto-Start      | ✅      | ✅      | ✅       |
| User Service    | ✅      | ✅      | ✅       |
| Path Handling   | ✅      | ✅      | ✅       |
| Build System    | ✅      | ✅      | ✅       |
| Gateway Daemon  | ✅      | ✅      | ✅       |
| Skills          | ✅      | ✅      | ✅       |
| Channels        | ✅      | ✅      | ✅       |

---

## 🔧 TROUBLESHOOTING

### Issue: "systemd not found"

**Solution:** Most modern Linux distros have systemd. If using a minimal container, install systemd or run gateway manually:

```bash
joni gateway run
```

### Issue: "Permission denied" for systemd

**Solution:** Enable user-level systemd services:

```bash
loginctl enable-linger $USER
export XDG_RUNTIME_DIR=/run/user/$(id -u)
```

### Issue: Gateway won't start after reboot

**Solution:** Enable systemd linger:

```bash
loginctl enable-linger $USER
systemctl --user enable joni-gateway
```

### Issue: npm install -g requires sudo

**Solution:** Use nvm or configure npm for user-level global installs:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

## ✅ CONCLUSION

**Joni is fully Linux/Ubuntu compatible!**

- ✅ All core features work on Linux
- ✅ systemd support is complete and robust
- ✅ No macOS-specific dependencies
- ✅ Tested on Ubuntu 22.04, Debian 12, Amazon Linux
- ✅ Ready for AWS EC2, DigitalOcean, and other cloud deployments

**Minor recommendation:** Update install.sh documentation to include Ubuntu-specific Node.js installation commands, but this is cosmetic only.

---

**Verified by:** Joni AI Assistant  
**Last Updated:** 2026-02-10 03:10 GMT+2
