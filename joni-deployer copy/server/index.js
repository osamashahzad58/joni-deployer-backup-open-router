const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const os = require('os');
const { setupChannelRoutes } = require('./channel-routes');
const { createOpenRouterKeys, createOpenRouterKeysWithLimit } = require('./lib/create-openrouter-keys');

const app = express();
const PORT = 3100;

// Enable test mode with: TEST_MODE=true npm start
const TEST_MODE = process.env.TEST_MODE === 'true';

// Track active deployment sessions to prevent reconnect from old tabs
const activeDeploymentSessions = new Set();
// Track session IDs that have already been used (success or failure) to prevent endless retries
const usedDeploymentSessions = new Set();
const activeLocalInstallSessions = new Set();

app.use(cors());
app.use(express.json());

// Setup channel proxy routes
setupChannelRoutes(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'JONI Deployer API is running',
    testMode: TEST_MODE
  });
});

// Create OpenRouter API keys only (no deployment). Optional credit limit in USD (default $50).
app.post('/api/create-openrouter-keys', async (req, res) => {
  const limit = Math.max(0, Number(req.body?.limit ?? req.query?.limit ?? 50));
  const managementKey = process.env.OPENROUTER_MANAGEMENT_KEY;
  try {
    const keys = await createOpenRouterKeysWithLimit(managementKey, limit);
    res.json({ sonnet45Key: keys.sonnet45Key, gemini3ProKey: keys.gemini3ProKey });
  } catch (err) {
    console.error('❌ Create OpenRouter keys failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Spin up a single EC2 instance only (Ubuntu 22.04, t3.medium). No JONI install.
// Requires: AWS CLI configured, key pair (env KEY_NAME, default joni-key).
app.post('/api/launch-ec2', async (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'launch-ec2-only.sh');
  const fs = require('fs');
  if (!fs.existsSync(scriptPath)) {
    return res.status(500).json({ error: `Script not found: ${scriptPath}` });
  }
  return new Promise((resolve) => {
    const child = spawn('bash', [scriptPath], {
      cwd: path.dirname(scriptPath),
      env: { ...process.env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ launch-ec2 script failed:', stderr);
        return resolve(res.status(500).json({ error: stderr.trim() || 'EC2 launch failed' }));
      }
      const instanceId = (stdout.match(/INSTANCE_ID=(\S+)/) || [])[1];
      const publicIp = (stdout.match(/PUBLIC_IP=(\S+)/) || [])[1];
      const region = (stdout.match(/REGION=(\S+)/) || [])[1] || process.env.AWS_REGION || 'us-east-1';
      if (!instanceId || !publicIp) {
        return resolve(res.status(500).json({ error: 'Could not parse instance ID or IP from script output' }));
      }
      console.log(`🔑 EC2 launched: ${instanceId} @ ${publicIp}`);
      resolve(res.json({ instanceId, publicIp, region }));
    });
  });
});

// SSE endpoint for deployment
app.get('/api/deploy', async (req, res) => {
  const username = req.query.username || 'user';
  const sessionId = req.query.sessionId;
  
  // CRITICAL: Validate session ID to prevent reconnect from old tabs
  if (!sessionId) {
    console.error(`❌ Deployment request rejected: No session ID provided (username: ${username})`);
    res.status(400).json({ error: 'Missing deployment session ID. Please start from the beginning.' });
    return;
  }
  
  // Check if this session was already used
  if (activeDeploymentSessions.has(sessionId)) {
    console.error(`❌ Deployment request rejected: Session ID already used (sessionId: ${sessionId}, username: ${username})`);
    res.status(409).json({ error: 'This deployment session is already in progress or was already completed.' });
    return;
  }
  
  // Mark this session as active
  activeDeploymentSessions.add(sessionId);
  console.log(`✅ New deployment session accepted: ${sessionId} for username: ${username}`);
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  console.log(`🚀 Starting deployment for username: ${username} ${TEST_MODE ? '[TEST MODE]' : '[PRODUCTION]'}`);

  // In production: create OpenRouter keys (Sonnet 4.5 + Gemini 3 Pro image) before running deploy script
  let openRouterKeys = null;
  if (!TEST_MODE) {
    const managementKey = process.env.OPENROUTER_MANAGEMENT_KEY;
    try {
      openRouterKeys = await createOpenRouterKeysWithLimit(managementKey, 50);
      res.write(`data: ${JSON.stringify({ type: 'openrouter-keys', keys: { sonnet45Key: openRouterKeys.sonnet45Key, gemini3ProKey: openRouterKeys.gemini3ProKey } })}\n\n`);
      console.log('🔑 OpenRouter keys created for deployment');
    } catch (err) {
      console.error('❌ OpenRouter key creation failed:', err.message);
      res.write(`data: ${JSON.stringify({ type: 'error', message: `OpenRouter keys failed: ${err.message}` })}\n\n`);
      res.end();
      activeDeploymentSessions.delete(sessionId);
      return;
    }
  }

  // Path to the deployment script (production: joni-fix sibling project)
  const JONI_FIX_ROOT = process.env.JONI_FIX_ROOT || path.join(__dirname, '..', '..', 'joni-fix');
  let scriptPath;
  if (TEST_MODE) {
    scriptPath = path.join(__dirname, 'test-deploy.sh');
  } else {
    scriptPath = path.join(JONI_FIX_ROOT, 'deploy-joni-aws-final.sh');
  }
  
  // Check if script exists
  const fs = require('fs');
  if (!fs.existsSync(scriptPath)) {
    const errorMsg = `Deployment script not found at: ${scriptPath}`;
    console.error(`❌ ${errorMsg}`);
    res.write(`data: ${JSON.stringify({ type: 'error', message: errorMsg })}\n\n`);
    res.end();
    return;
  }

  console.log(`📜 Executing script: ${scriptPath} with username: ${username}`);

  const deployEnv = { ...process.env };
  if (openRouterKeys) {
    deployEnv.OPENROUTER_SONNET_4_5_KEY = openRouterKeys.sonnet45Key;
    deployEnv.OPENROUTER_GEMINI_2_5_FLASH_KEY = openRouterKeys.gemini3ProKey;
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    deployEnv.OPENAI_API_KEY = openaiKey;
  }

  // Spawn the deployment script with username as argument
  const deployProcess = spawn('bash', [scriptPath, username], {
    cwd: path.dirname(scriptPath),
    env: deployEnv
  });

  let stdoutBuffer = '';
  let stderrBuffer = '';
  let deploymentData = {
    ip: null,
    token: null,
    instanceId: null
  };

  // Handle stdout (server-only logs; parse for deployment data, no SSE log events)
  deployProcess.stdout.on('data', (data) => {
    const output = data.toString();
    stdoutBuffer += output;
    const lines = output.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`📤 ${line}`);
      if (line.includes('Instance ID:')) {
        const idMatch = line.match(/Instance ID:\s*(i-[a-zA-Z0-9]+)/);
        if (idMatch) deploymentData.instanceId = idMatch[1];
      }
      if (line.includes('Public IP:') || line.includes('Instance IP:')) {
        const ipMatch = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
        if (ipMatch) deploymentData.ip = ipMatch[0];
      }
      if (line.includes('AUTH_TOKEN=') || line.includes('token:') || line.includes('Token:')) {
        const tokenMatch = line.match(/(?:AUTH_TOKEN=|[Tt]oken:\s*)([a-zA-Z0-9-_]+)/);
        if (tokenMatch) deploymentData.token = tokenMatch[1];
      }
    });
  });

  deployProcess.stderr.on('data', (data) => {
    stderrBuffer += data.toString();
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => console.error(`⚠️  ${line}`));
  });

  // Handle process completion
  deployProcess.on('close', (code) => {
    console.log(`🏁 Deployment process exited with code ${code}`);
    
    // Remove session ID from active set (allow future deployments)
    activeDeploymentSessions.delete(sessionId);
    console.log(`🗑️ Removed session ${sessionId} from active deployments`);
    
    if (code === 0) {
      // Success
      console.log('✅ Deployment completed successfully');
      console.log('📊 Deployment data:', deploymentData);
      
      // Send completion message
      const completeMessage = `data: ${JSON.stringify({ 
        type: 'complete', 
        data: deploymentData 
      })}\n\n`;
      res.write(completeMessage);
      console.log('📤 Sent completion event to frontend');
      
      // Flush and wait a moment before ending to ensure delivery
      if (res.flush) res.flush();
      setTimeout(() => {
        res.end();
        console.log('🏁 SSE connection closed');
      }, 500);
    } else {
      // Error
      const errorMsg = `Deployment failed with exit code ${code}`;
      console.error(`❌ ${errorMsg}`);
      
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: errorMsg,
        stderr: stderrBuffer
      })}\n\n`);
      
      setTimeout(() => res.end(), 500);
    }
  });

  // Handle process errors
  deployProcess.on('error', (error) => {
    const errorMsg = `Failed to start deployment: ${error.message}`;
    console.error(`❌ ${errorMsg}`);
    
    // Remove session ID from active set
    activeDeploymentSessions.delete(sessionId);
    console.log(`🗑️ Removed session ${sessionId} after error`);
    
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: errorMsg 
    })}\n\n`);
    res.end();
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log('👋 Client disconnected');
    // Don't kill the process - let it complete
    // Don't remove session ID yet - deployment continues in background
    // It will be removed when process completes
  });
});

// SSE endpoint for local install (joni-fix install-joni-docker.sh with generated API keys)
app.get('/api/install-local', async (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    res.status(400).json({ error: 'Missing session ID. Please start from the beginning.' });
    return;
  }
  if (activeLocalInstallSessions.has(sessionId)) {
    res.status(409).json({ error: 'This local install session is already in progress or completed.' });
    return;
  }
  activeLocalInstallSessions.add(sessionId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendLog = (msg) => res.write(`data: ${JSON.stringify({ type: 'log', message: msg })}\n\n`);
  const sendError = (msg) => res.write(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`);

  sendLog('Starting local install...');
  sendLog('Creating OpenRouter API keys (Sonnet 4.5 + Gemini 3 Pro image)...');

  const managementKey = process.env.OPENROUTER_MANAGEMENT_KEY;
  let openRouterKeys;
  try {
    openRouterKeys = await createOpenRouterKeysWithLimit(managementKey, 50);
    sendLog('OpenRouter keys created ($50 limit each).');
    res.write(`data: ${JSON.stringify({ type: 'openrouter-keys', keys: { sonnet45Key: openRouterKeys.sonnet45Key, gemini3ProKey: openRouterKeys.gemini3ProKey } })}\n\n`);
  } catch (err) {
    console.error('❌ OpenRouter key creation failed (install-local):', err.message);
    sendError(`OpenRouter keys failed: ${err.message}`);
    res.end();
    activeLocalInstallSessions.delete(sessionId);
    return;
  }

  const JONI_FIX_ROOT = process.env.JONI_FIX_ROOT || path.join(__dirname, '..', '..', 'joni-fix');
  const scriptPath = path.join(JONI_FIX_ROOT, 'install-joni-docker.sh');
  const fs = require('fs');
  if (!fs.existsSync(scriptPath)) {
    sendError(`Install script not found: ${scriptPath}`);
    res.end();
    activeLocalInstallSessions.delete(sessionId);
    return;
  }

  sendLog(`Running install from ${JONI_FIX_ROOT}...`);
  const deployEnv = { ...process.env };
  deployEnv.OPENROUTER_SONNET_4_5_KEY = openRouterKeys.sonnet45Key;
  deployEnv.OPENROUTER_GEMINI_2_5_FLASH_KEY = openRouterKeys.gemini3ProKey;
  if (process.env.OPENAI_API_KEY) deployEnv.OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  const installProcess = spawn('bash', [scriptPath], {
    cwd: JONI_FIX_ROOT,
    env: deployEnv
  });

  installProcess.stdout.on('data', (data) => {
    data.toString().split('\n').filter(l => l.trim()).forEach(line => {
      sendLog(line);
    });
  });
  installProcess.stderr.on('data', (data) => {
    data.toString().split('\n').filter(l => l.trim()).forEach(line => {
      sendLog(`[stderr] ${line}`);
    });
  });

  installProcess.on('close', (code) => {
    activeLocalInstallSessions.delete(sessionId);
    if (code === 0) {
      res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    } else {
      sendError(`Install failed with exit code ${code}`);
    }
    if (res.flush) res.flush();
    setTimeout(() => res.end(), 500);
  });

  installProcess.on('error', (err) => {
    sendError(`Failed to start install: ${err.message}`);
    activeLocalInstallSessions.delete(sessionId);
    res.end();
  });

  req.on('close', () => {});
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 JONI Deployer API Server`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`   Status:   Running ${TEST_MODE ? '🧪 [TEST MODE]' : '🔴 [PRODUCTION]'}`);
  console.log(`   Port:     ${PORT}`);
  console.log(`   Base URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📡 Endpoints:');
  console.log(`   GET  /api/health       - Health check`);
  console.log(`   GET  /api/deploy       - Start deployment (SSE)`);
  console.log(`   GET  /api/install-local - Local install with API keys (SSE)`);
  console.log('');
  if (TEST_MODE) {
    console.log('⚠️  TEST MODE ACTIVE - Using mock deployment script');
    console.log('   No real AWS resources will be created');
    console.log('   To disable: Remove TEST_MODE=true from environment');
  } else {
    console.log('✅ Production mode - Will execute real AWS deployment');
    console.log('   To enable test mode: TEST_MODE=true npm start');
  }
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
