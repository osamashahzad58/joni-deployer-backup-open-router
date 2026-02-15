# JONI Deployer - Web UI Demo

A beautiful web interface for deploying JONI AI instances to AWS.

## Features

- 🎨 Modern glassmorphism UI with dark theme
- 🚀 One-click AWS EC2 deployment
- 📊 Real-time deployment progress tracking
- 💬 Multi-channel support (Telegram, WhatsApp, Discord)
- ⚡ 10-15 minute automated setup
- 🐙 JONI personality-driven messaging

## Project Structure

```
joni-deployer/
├── src/
│   ├── components/
│   │   ├── Landing.jsx              # Landing page with "Create Account"
│   │   ├── NameCollection.jsx       # Username collection modal
│   │   ├── DeploymentProgress.jsx   # Real-time deployment progress
│   │   └── ChannelSelector.jsx      # Channel selection (Telegram/WhatsApp/Discord)
│   ├── App.jsx                       # Main app flow
│   └── main.jsx
├── server/
│   ├── index.js                      # Express API with SSE endpoint
│   └── package.json
└── package.json                      # Frontend dependencies
```

## Installation

### 1. Install Frontend Dependencies
```bash
cd ~/Desktop/joni-deployer
npm install
```

### 2. Install Backend Dependencies
```bash
cd ~/Desktop/joni-deployer/server
npm install
```

## Running the Application

You need **two separate terminals**:

### Terminal 1: Backend API Server
```bash
cd ~/Desktop/joni-deployer/server
npm start
```
This starts the Express server on **port 3100** with the SSE deployment endpoint.

### Terminal 2: Frontend Dev Server
```bash
cd ~/Desktop/joni-deployer
npm run dev
```
This starts the Vite dev server on **port 3000**.

## Usage Flow

1. **Name Collection**: User enters their name
2. **Landing Screen**: User clicks "Create Account"
3. **Deployment Progress**: Live deployment with:
   - Real-time progress messages ("🐙 JONI is waking up...")
   - 5 deployment stages (EC2 → Docker → GitHub → Build → Gateway)
   - Live timer (updates every second)
   - Instance naming: `JONI-{username}`
4. **Channel Selection**: Choose Telegram/WhatsApp/Discord after completion

## Technical Stack

**Frontend:**
- React 18 + Vite
- react-icons
- CSS3 (Glassmorphism + Dark Theme)

**Backend:**
- Express.js
- Server-Sent Events (SSE)
- Executes `deploy-joni-aws-final.sh` for AWS deployment

**Deployment:**
- AWS EC2 (t3.medium, 20GB disk)
- Docker
- GitHub (clones JONI repository)

## API Endpoints

### Backend Server (Port 3100)

- `GET /api/health` - Health check
- `GET /api/deploy?username={name}&sessionId={id}` - Start deployment (SSE stream)

### SSE Event Types

```javascript
// Log message
{ type: 'log', message: 'Creating EC2 instance...' }

// Deployment complete
{ type: 'complete', data: { ip: '1.2.3.4', token: 'abc123', instanceId: 'i-xyz' } }

// Error
{ type: 'error', message: 'Deployment failed', stderr: '...' }
```

## Security Features

- ✅ Session ID validation (prevents auto-deployment on server restart)
- ✅ Username sanitization (removes special chars, spaces → hyphens)
- ✅ Duplicate session rejection
- ✅ Deployment only starts after explicit user action

## Configuration

### Ports
- Frontend: 3000 (Vite dev server)
- Backend: 3100 (Express API)

### Deployment Script
The backend expects the deployment script at:
```
~/.openclaw/workspace/deploy-joni-aws-final.sh
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use alternative port (edit vite.config.js)
```

### Backend Not Connecting
```bash
# Check backend server is running
curl http://localhost:3100/api/health

# Verify deployment script exists
ls -la ~/.openclaw/workspace/deploy-joni-aws-final.sh
```

### Deployment Fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check script permissions
chmod +x ~/.openclaw/workspace/deploy-joni-aws-final.sh

# View backend logs in terminal for details
```

## Documentation

- `JONI_CLI_Commands_Guide.md` - CLI commands reference
- `COMPLETION_FIX.md` - Deployment completion fixes
- `SESSION_ID_FIX.md` - Session ID security implementation
- `BUTTON_TRIGGER_FIX.md` - Button-triggered deployment
- `JONI_PERSONALITY_MESSAGES.md` - Personality-driven UI messages

## Development

### Building for Production
```bash
# Build frontend
cd ~/Desktop/joni-deployer
npm run build

# The dist/ folder contains static files
```

## Repository

- **GitHub**: https://github.com/TokenTimes/JONI-DEPLOYER-DEMO
- **JONI Repository**: https://github.com/TokenTimes/JONI

## License

MIT

## Support

For issues or questions:
- Check backend logs (terminal running `npm start`)
- Check browser console (F12)
- Review deployment script output

---

**Built with ❤️ for JONI AI Platform**
# JONI-BRAIN-CLIENT-AND-SERVER
