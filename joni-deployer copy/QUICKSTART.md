# JONI Deployer - Quick Start Guide

Get up and running in 60 seconds!

## Prerequisites

✅ Node.js 18+ installed  
✅ AWS CLI configured with credentials  
✅ Deployment script at `~/.openclaw/workspace/deploy-joni-aws-final.sh`

## Installation

```bash
cd ~/Desktop/joni-deployer

# Install all dependencies
npm install
cd server && npm install && cd ..
```

## Testing Without AWS (Recommended First!)

Test the UI flow without deploying to AWS:

```bash
# Start backend in TEST MODE
cd ~/Desktop/joni-deployer/server
TEST_MODE=true npm start
```

Then in another terminal:

```bash
# Start frontend
cd ~/Desktop/joni-deployer
npm run dev
```

This uses a mock deployment script that simulates the real deployment in ~60 seconds.

## Running (Easy Mode)

Use the provided start script:

```bash
./start-dev.sh
```

This will:
1. Check dependencies
2. Start backend API on port 3100
3. Start frontend dev server on port 3000
4. Open your browser automatically

## Running (Manual Mode)

### Terminal 1: Backend

```bash
cd ~/Desktop/joni-deployer/server
npm start
```

### Terminal 2: Frontend

```bash
cd ~/Desktop/joni-deployer
npm run dev
```

## Testing the Flow

1. **Landing Page**: Click "Create Account" button
2. **Deployment**: Watch real-time progress (10-15 minutes)
3. **Channel Selection**: Choose Telegram, WhatsApp, or Discord
4. **Done**: Your JONI instance is ready!

## Troubleshooting

### Ports in use?

```bash
# Kill existing processes
lsof -ti:3000,3001,3100 | xargs kill -9

# Or use the start script (does this automatically)
./start-dev.sh
```

### Backend won't connect?

```bash
# Test backend health
curl http://localhost:3100/api/health

# Should return: {"status":"ok","message":"JONI Deployer API is running"}
```

### No deployment logs?

Check browser console (F12) → Network tab → Look for `/api/deploy` SSE connection

### Script not found?

Make sure deployment script exists:
```bash
ls -la ~/.openclaw/workspace/deploy-joni-aws-final.sh
```

## What's Next?

- Check `README.md` for detailed documentation
- Customize the UI in `src/components/`
- Add more deployment stages in `DeploymentProgress.jsx`
- Integrate real channel configuration endpoints

## Architecture

```
Frontend (Port 3000)          Backend (Port 3100)
┌─────────────────┐          ┌──────────────────┐
│  Landing.jsx    │          │   Express API    │
│       ↓         │  ─────→  │                  │
│ DeployProgress  │  ← SSE   │  /api/deploy     │
│       ↓         │          │      ↓           │
│ ChannelSelector │          │  spawn bash      │
└─────────────────┘          │  deploy script   │
                             └──────────────────┘
```

## Support

Having issues? Check:

1. **Backend Terminal** - Look for error messages
2. **Browser Console** (F12) - Check for network errors
3. **AWS Credentials** - `aws sts get-caller-identity`
4. **Script Permissions** - `chmod +x ~/.openclaw/workspace/deploy-joni-aws-final.sh`

## Happy Deploying! 🚀
