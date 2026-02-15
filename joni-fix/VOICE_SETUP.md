# Voice transcription (Whisper)

Voice messages are transcribed using **OpenAI Whisper** with the **`whisper-1`** model. The gateway needs an OpenAI API key and `tools.media.audio.models` set to `whisper-1` (not `gpt-4o-mini-transcribe`).

## Voice not working? Gateway must be running

**JONI and OpenClaw are different bots.** Voice is configured on **JONI**. If you’re sending voice to the OpenClaw Telegram bot, it won’t use JONI’s Whisper config. You need to:

1. **Use the JONI Telegram bot** (the one you added with `joni-cli channels add --channel telegram --token <JONI-bot-token>`).
2. **Have the JONI gateway running** – if it’s not running, voice (and everything else) will fail.

### Start JONI gateway (Docker)

From the **joni-fix** directory (where `docker-compose.yml` lives):

```bash
cd /path/to/joni-fix
docker compose up -d joni-gateway
```

Check it’s up:

```bash
docker compose ps
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:18890
# 200 or 301 is OK
```

If you were running OpenClaw instead and want to use JONI for voice:

```bash
openclaw gateway stop   # stop OpenClaw
cd /path/to/joni-fix
docker compose up -d joni-gateway   # start JONI
```

Then send voice messages to the **JONI** bot on Telegram, not the OpenClaw bot.

**Note:** `joni status` from the host may look for `docker-compose.yml` in `~/Documents/JONI`. From the joni-fix project dir, use:

```bash
docker compose run --rm joni-cli status
```

When the CLI runs inside a container, “Gateway unreachable” often means the CLI container can’t reach `127.0.0.1` (that’s the container, not the host). To verify the gateway from the host: `curl -s http://127.0.0.1:18890` or `docker compose ps`.

## After install (Docker)

The install script sets the key in two places:

1. **`.env.joni`** (in the project dir) – the gateway loads this as env. If `OPENAI_API_KEY` was empty, a preset key is written so voice works.
2. **`~/.joni/joni.json`** (config) – `models.providers.openai.apiKey` and `skills.entries["openai-whisper-api"].apiKey` are set from env or preset.

**If voice says "wrong model" or transcription fails:** the config must use `whisper-1`. Fix existing config:
```bash
sed -i.bak 's/"gpt-4o-mini-transcribe"/"whisper-1"/g' ~/.joni/joni.json
docker compose restart joni-gateway
```

**If voice still says "OpenAI API key isn't configured":**

1. **Restart the gateway** so it reloads config and env:
   ```bash
   docker compose restart joni-gateway
   ```

2. **Or set your own key** in `.env.joni` (in the joni-fix dir):
   ```bash
   # Edit .env.joni and set:
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
   Then restart: `docker compose restart joni-gateway`.

3. **Or edit the config** (path is `~/.joni/joni.json` on the host; in Docker it’s the mounted config dir):
   ```json
   {
     "skills": {
       "entries": {
         "openai-whisper-api": {
           "apiKey": "YOUR_ACTUAL_OPENAI_API_KEY_HERE"
         }
       }
     },
     "models": {
       "providers": {
         "openai": {
           "baseUrl": "https://api.openai.com/v1",
           "apiKey": "YOUR_ACTUAL_OPENAI_API_KEY_HERE",
           "models": []
         }
       }
     }
   }
   ```
   Then restart the gateway.

## Deployer “Install locally”

When you run **Install locally** from the deployer UI, set **OPENAI_API_KEY** in the deployer’s `.env` (or environment) so the install script can write it into the project’s `.env.joni`. If you don’t set it, the script uses a preset key so voice works out of the box.
