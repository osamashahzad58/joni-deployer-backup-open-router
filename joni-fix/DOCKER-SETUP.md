# JONI Docker Setup 🐙🐳

## Quick Start

### 1. Configure API Keys

```bash
cp .env.joni.example .env.joni
# Edit .env.joni with your actual API keys
```

**Required:**

- `ANTHROPIC_API_KEY` - Your Anthropic Claude API key

**Optional:**

- `GEMINI_API_KEY` - For nano-banana-pro skill
- `OPENAI_API_KEY` - For openai-whisper-api skill

### 2. Build & Run

```bash
./docker-setup.sh
```

This will:

1. Build the Docker image with `.env.joni` baked in
2. Run onboarding (interactive)
3. Start the JONI gateway

---

## What Gets Baked Into The Image

The `.env.joni` file is **copied into the Docker image** during build.

**Security note:** Your API keys will be embedded in the image. Don't push this image to public registries!

---

## Manual Docker Commands

### Build

```bash
docker build -t joni:local .
```

### Run Gateway

```bash
docker compose up -d joni-gateway
```

### Run CLI

```bash
docker compose run --rm joni-cli
```

### View Logs

```bash
docker compose logs -f joni-gateway
```

---

## Environment Variables

The image loads `.env.joni` automatically at startup.

**File location in container:** `/app/.env.joni`

**Loaded by:** `setup-joni.sh` and gateway startup

---

## Ports

- **18890** - JONI Gateway (default)
- **18891** - Bridge port

Override in `.env`:

```bash
JONI_GATEWAY_PORT=18890
JONI_BRIDGE_PORT=18891
```

---

## Data Persistence

**Volumes:**

- `~/.joni` - Config & credentials
- `~/.joni/workspace` - Agent workspace

**Override:**

```bash
export JONI_CONFIG_DIR=/path/to/config
export JONI_WORKSPACE_DIR=/path/to/workspace
./docker-setup.sh
```

---

## Troubleshooting

### API Keys Not Working?

1. Check `.env.joni` exists and has correct keys
2. Rebuild image: `docker build -t joni:local .`
3. Restart: `docker compose restart joni-gateway`

### Gateway Not Accessible?

Check bind setting in `docker-compose.yml`:

```yaml
--bind lan  # accessible from network
--bind loopback  # localhost only
```

### View Gateway Logs

```bash
docker compose logs -f joni-gateway
```

---

## Security Best Practices

1. **Don't push the image to public registries** (contains your API keys!)
2. Keep `.env.joni` in `.gitignore` (already done)
3. Use strong gateway tokens
4. Bind to `loopback` unless you need LAN access

---

## Next Steps

After setup:

- Gateway running: `http://localhost:18890`
- Connect Telegram: `docker compose run --rm joni-cli configure --section channels`
- Check status: `docker compose exec joni-gateway node dist/index.js status`

---

**Ready to ship!** 🐙
