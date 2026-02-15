# JONI Quick Setup Guide 🐙

## One-Command Setup (Recommended)

```bash
cd ~/Desktop/joni

# 1. Copy and configure API keys
cp .env.joni.example .env.joni
# Edit .env.joni with your API keys

# 2. Install + Build
./install.sh

# 3. Auto-configure with all defaults (no questions!)
./setup-joni.sh

# 4. Start JONI
joni gateway start
joni
```

That's it! 🎉

---

## What `setup-joni.sh` Does

✅ **Loads API keys** from `.env.joni`  
✅ **Runs `joni onboard`** with all presets:

- Onboarding mode: **QuickStart**
- Auth: **Anthropic** (Claude)
- Channels: **Skipped** (won't touch OpenClaw's Telegram!)
- Skills: **Auto-configured** with API keys
- Hooks: **All enabled** (boot-md, command-logger, session-memory)

✅ **No prompts, no questions** - just works!

---

## Reset & Reconfigure

```bash
./setup-joni.sh --reset
```

This will:

- Delete `~/.joni/`
- Stop JONI daemon
- Reconfigure from scratch

---

## Side-by-Side with OpenClaw

JONI and OpenClaw run **without interfering**:

|              | OpenClaw              | JONI              |
| ------------ | --------------------- | ----------------- |
| **Port**     | 18789                 | 18890             |
| **Config**   | `~/.openclaw/`        | `~/.joni/`        |
| **Telegram** | ✅ Connected          | ❌ Skipped        |
| **Daemon**   | `ai.openclaw.gateway` | `ai.joni.gateway` |

Both can run at the same time! 🎉

---

## API Keys

Edit `.env.joni` to change API keys:

```bash
# Main API Keys
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-proj-...
```

Then run:

```bash
./setup-joni.sh --reset
```

---

## Manual Configuration

If you want to configure manually:

```bash
joni onboard
```

This will ask questions interactively.

---

## Troubleshooting

**JONI conflicts with OpenClaw?**

- Check ports: `openclaw gateway status` and `joni gateway status`
- JONI should use port **18890**
- OpenClaw should use port **18789**

**API keys not working?**

- Check `.env.joni` exists
- Re-run: `./setup-joni.sh --reset`

**Want to change Telegram bot?**

- Don't! Use OpenClaw for Telegram
- JONI is for local/API use only (to avoid conflicts)

---

Happy hacking! 🐙
