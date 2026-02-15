/**
 * Channel Configuration Proxy Routes
 *
 * Telegram configure/verify run on the instance via SSH (joni-cli in Docker).
 * Other channel endpoints still use HTTP to the gateway where supported.
 */

const axios = require('axios');
const { execFile } = require('child_process');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// Default Gateway port for JONI
const JONI_GATEWAY_PORT = 18890;

// SSH: same key/user as deploy script (deploy-joni-aws-final.sh)
const SSH_KEY_FILE = process.env.SSH_KEY_FILE || path.join(process.env.HOME || '', '.ssh', 'joni-key.pem');
const SSH_USER = process.env.SSH_USER || 'ubuntu';
const JONI_REMOTE_DIR = process.env.JONI_REMOTE_DIR || '~/JONI';

/**
 * Escape a string for use inside a single-quoted remote shell command
 */
function escapeForRemoteShell(str) {
  if (typeof str !== 'string') return "''";
  return "'" + str.replace(/'/g, "'\"'\"'") + "'";
}

/**
 * Run a command on the instance via SSH (used for joni-cli in Docker)
 */
async function runSshCommand(instanceIp, remoteCommand, timeoutMs = 120000) {
  await execFileAsync('ssh', [
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'ConnectTimeout=10',
    '-i', SSH_KEY_FILE,
    `${SSH_USER}@${instanceIp}`,
    remoteCommand
  ], { timeout: timeoutMs, maxBuffer: 2 * 1024 * 1024 });
}

/** Run SSH command and return stdout (for checks). */
async function runSshCommandWithOutput(instanceIp, remoteCommand, timeoutMs = 15000) {
  const { stdout } = await execFileAsync('ssh', [
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'ConnectTimeout=10',
    '-i', SSH_KEY_FILE,
    `${SSH_USER}@${instanceIp}`,
    remoteCommand
  ], { timeout: timeoutMs, maxBuffer: 1024 * 1024 });
  return (stdout || '').trim();
}

/**
 * Create axios instance for JONI Gateway communication
 */
function createJoniClient(instanceIp, authToken) {
  const baseURL = `http://${instanceIp}:${JONI_GATEWAY_PORT}`;

  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  });
}

/**
 * Send RPC request to JONI Gateway (used only where gateway exposes HTTP JSON-RPC)
 */
async function joniRpcCall(client, method, params = {}) {
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };

  const response = await client.post('/', payload);

  if (response.data.error) {
    throw new Error(response.data.error.message || 'JONI Gateway error');
  }

  return response.data.result;
}

/**
 * Setup channel configuration routes
 */
function setupChannelRoutes(app) {
  
  /**
   * GET /api/instance/channels/status
   * Check channel configuration status on EC2 instance
   */
  app.get('/api/instance/channels/status', async (req, res) => {
    try {
      const { instanceIp, authToken } = req.query;

      if (!instanceIp) {
        return res.status(400).json({ 
          error: 'Missing instanceIp parameter' 
        });
      }

      console.log(`📡 Checking channel status on ${instanceIp}`);

      const client = createJoniClient(instanceIp, authToken);
      const result = await joniRpcCall(client, 'channels.config.status');

      console.log('✅ Channel status retrieved:', result);
      res.json(result);

    } catch (error) {
      console.error('❌ Failed to get channel status:', error.message);
      res.status(500).json({ 
        error: 'Failed to get channel status',
        message: error.message 
      });
    }
  });

  /**
   * POST /api/instance/channels/telegram/configure
   * Configure Telegram bot by patching joni.json on the instance (no CLI/extension required).
   */
  app.post('/api/instance/channels/telegram/configure', async (req, res) => {
    try {
      const { instanceIp, authToken, botToken, accountId } = req.body;

      if (!instanceIp || !botToken) {
        return res.status(400).json({
          error: 'Missing required fields: instanceIp, botToken'
        });
      }

      console.log(`📡 Configuring Telegram on ${instanceIp} (config patch)`);

      // Patch ~/.joni/joni.json: channels.telegram + plugins.allow + plugins.entries.telegram.enabled
      // (Gateway only starts Telegram when plugin is allowlisted and enabled.)
      const nodeScript = [
        "const fs=require('fs');",
        "const p='/home/node/.joni/joni.json';",
        "let c={};",
        "try{c=JSON.parse(fs.readFileSync(p,'utf8'));}catch(e){};",
        "c.channels=c.channels||{};",
        "c.channels.telegram={...(c.channels.telegram||{}),enabled:true,dmPolicy:'pairing',botToken:process.env.BOT_TOKEN};",
        "c.plugins=c.plugins||{};",
        "c.plugins.allow=Array.isArray(c.plugins.allow)?c.plugins.allow:[];",
        "if(!c.plugins.allow.includes('telegram'))c.plugins.allow.push('telegram');",
        "c.plugins.entries=c.plugins.entries||{};",
        "c.plugins.entries.telegram={...(c.plugins.entries.telegram||{}),enabled:true};",
        "fs.writeFileSync(p,JSON.stringify(c,null,2));"
      ].join('');
      const remoteCmd = `cd ${JONI_REMOTE_DIR} && docker compose run --rm -v ~/.joni:/home/node/.joni -e BOT_TOKEN=${escapeForRemoteShell(botToken)} --entrypoint node joni-cli -e ${escapeForRemoteShell(nodeScript)}`;
      await runSshCommand(instanceIp, remoteCmd, 60000);

      // Restart gateway so it picks up the new Telegram config
      const restartCmd = `cd ${JONI_REMOTE_DIR} && docker compose restart joni-gateway`;
      await runSshCommand(instanceIp, restartCmd, 30000);

      // If the instance repo has no Telegram extension, the bot won't reply to /start
      let warning;
      try {
        const out = await runSshCommandWithOutput(instanceIp, `test -d ${JONI_REMOTE_DIR}/extensions/telegram && echo yes || echo no`, 10000);
        if (out !== 'yes') {
          warning = 'This instance may not have the Telegram extension. If the bot does not reply to /start, redeploy using a JONI repo that includes extensions/telegram (set JONI_CLONE_URL before deploying).';
        }
      } catch (_) {
        warning = 'Could not verify Telegram extension on instance. If the bot does not reply to /start, redeploy from a JONI repo that includes extensions/telegram.';
      }

      console.log('✅ Telegram configured successfully');
      res.json(warning ? { ok: true, warning } : { ok: true });

    } catch (error) {
      console.error('❌ Failed to configure Telegram:', error.message);
      res.status(500).json({
        error: 'Failed to configure Telegram',
        message: error.message
      });
    }
  });

  /**
   * GET /api/instance/channels/telegram/pairing-code
   * Get Telegram pairing code from EC2 instance
   */
  app.get('/api/instance/channels/telegram/pairing-code', async (req, res) => {
    try {
      const { instanceIp, authToken } = req.query;

      if (!instanceIp) {
        return res.status(400).json({ 
          error: 'Missing instanceIp parameter' 
        });
      }

      console.log(`📡 Getting Telegram pairing code from ${instanceIp}`);

      const client = createJoniClient(instanceIp, authToken);
      const result = await joniRpcCall(client, 'channels.telegram.pairingCode');

      console.log('✅ Pairing code generated');
      res.json(result);

    } catch (error) {
      console.error('❌ Failed to get pairing code:', error.message);
      res.status(500).json({ 
        error: 'Failed to get pairing code',
        message: error.message 
      });
    }
  });

  /**
   * POST /api/instance/channels/telegram/verify
   * Verify Telegram pairing code on EC2 instance via SSH (joni-cli pairing approve)
   */
  app.post('/api/instance/channels/telegram/verify', async (req, res) => {
    try {
      const { instanceIp, authToken, pairingCode } = req.body;

      if (!instanceIp || !pairingCode) {
        return res.status(400).json({
          error: 'Missing required fields: instanceIp, pairingCode'
        });
      }

      console.log(`📡 Verifying Telegram pairing on ${instanceIp} (SSH + joni-cli)`);

      // Mount ~/.joni so CLI reads/writes the same pairing store as the gateway (otherwise approve is ephemeral).
      const remoteCmd = `cd ${JONI_REMOTE_DIR} && docker compose run --rm -v ~/.joni:/home/node/.joni -v ${JONI_REMOTE_DIR}/extensions:/app/extensions:ro -e JONI_BUNDLED_PLUGINS_DIR=/app/extensions joni-cli pairing approve telegram ${escapeForRemoteShell(pairingCode)}`;
      await runSshCommand(instanceIp, remoteCmd);

      console.log('✅ Telegram pairing verified');
      res.json({ ok: true });

    } catch (error) {
      console.error('❌ Failed to verify pairing:', error.message);
      res.status(500).json({
        error: 'Failed to verify pairing',
        message: error.message
      });
    }
  });

  /**
   * GET /api/instance/channels/whatsapp/qr
   * Get WhatsApp QR code from EC2 instance
   */
  app.get('/api/instance/channels/whatsapp/qr', async (req, res) => {
    try {
      const { instanceIp, authToken } = req.query;

      if (!instanceIp) {
        return res.status(400).json({ 
          error: 'Missing instanceIp parameter' 
        });
      }

      console.log(`📡 Getting WhatsApp QR code from ${instanceIp}`);

      const client = createJoniClient(instanceIp, authToken);
      const result = await joniRpcCall(client, 'channels.whatsapp.qr');

      console.log('✅ WhatsApp QR code generated');
      res.json(result);

    } catch (error) {
      console.error('❌ Failed to get WhatsApp QR:', error.message);
      res.status(500).json({ 
        error: 'Failed to get WhatsApp QR code',
        message: error.message 
      });
    }
  });

  /**
   * GET /api/instance/channels/whatsapp/status
   * Check WhatsApp connection status on EC2 instance
   */
  app.get('/api/instance/channels/whatsapp/status', async (req, res) => {
    try {
      const { instanceIp, authToken } = req.query;

      if (!instanceIp) {
        return res.status(400).json({ 
          error: 'Missing instanceIp parameter' 
        });
      }

      console.log(`📡 Checking WhatsApp status on ${instanceIp}`);

      const client = createJoniClient(instanceIp, authToken);
      const result = await joniRpcCall(client, 'channels.whatsapp.status');

      console.log('✅ WhatsApp status retrieved');
      res.json(result);

    } catch (error) {
      console.error('❌ Failed to get WhatsApp status:', error.message);
      res.status(500).json({ 
        error: 'Failed to get WhatsApp status',
        message: error.message 
      });
    }
  });

  /**
   * POST /api/instance/channels/discord/configure
   * Configure Discord bot on EC2 instance
   */
  app.post('/api/instance/channels/discord/configure', async (req, res) => {
    try {
      const { instanceIp, authToken, botToken, clientId, accountId } = req.body;

      if (!instanceIp || !botToken) {
        return res.status(400).json({ 
          error: 'Missing required fields: instanceIp, botToken' 
        });
      }

      console.log(`📡 Configuring Discord on ${instanceIp}`);

      const client = createJoniClient(instanceIp, authToken);
      const result = await joniRpcCall(client, 'channels.discord.configure', {
        botToken,
        clientId,
        accountId
      });

      console.log('✅ Discord configured successfully');
      res.json(result);

    } catch (error) {
      console.error('❌ Failed to configure Discord:', error.message);
      res.status(500).json({ 
        error: 'Failed to configure Discord',
        message: error.message 
      });
    }
  });

  console.log('✅ Channel proxy routes registered');
}

module.exports = { setupChannelRoutes };
