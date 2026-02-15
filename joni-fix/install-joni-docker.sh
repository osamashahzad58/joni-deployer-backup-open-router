#!/usr/bin/env bash
# JONI automated install for LOCAL machine (same flow as EC2 install, for testing).
# Run from joni-fix (or JONI) directory. Uses OpenRouter + OpenAI keys from env or .env.joni.
#
# From deployer UI "Install locally": server sets OPENROUTER_SONNET_4_5_KEY, etc., then runs this script.
# Manual run: export keys and run:
#   export OPENROUTER_SONNET_4_5_KEY=... OPENROUTER_GEMINI_2_5_FLASH_KEY=... OPENAI_API_KEY=...
#   ./install-joni-docker.sh
# Voice transcription (Whisper) requires OPENAI_API_KEY. Image generation uses OpenRouter (imageModel in config).
#
# Or create .env.joni in this directory first and run:
#   ./install-joni-docker.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# API keys: from env (deployer or manual export) or existing .env.joni
if [[ -f "$ROOT_DIR/.env.joni" ]]; then
  source "$ROOT_DIR/.env.joni"
  echo "✅ Using existing .env.joni"
fi

if [[ -z "${OPENROUTER_SONNET_4_5_KEY:-}" && -z "${OPENROUTER_API_KEY:-}" ]]; then
  echo "❌ Set OpenRouter key: export OPENROUTER_SONNET_4_5_KEY=... or OPENROUTER_API_KEY=..."
  echo "   And: OPENROUTER_GEMINI_2_5_FLASH_KEY=... (or GEMINI for images), OPENAI_API_KEY=..."
  exit 1
fi

OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-$OPENROUTER_SONNET_4_5_KEY}"
OPENROUTER_SONNET_4_5_KEY="${OPENROUTER_SONNET_4_5_KEY:-$OPENROUTER_API_KEY}"
OPENROUTER_GEMINI_2_5_FLASH_KEY="${OPENROUTER_GEMINI_2_5_FLASH_KEY:-$GEMINI_API_KEY}"
GEMINI_API_KEY="${GEMINI_API_KEY:-$OPENROUTER_GEMINI_2_5_FLASH_KEY}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-$OPENROUTER_API_KEY}"

echo ""
echo "🔑 Creating .env.joni (OpenRouter Sonnet 4.5 + Gemini + OpenAI)..."
{
  printf 'OPENROUTER_API_KEY=%s\n' "$OPENROUTER_API_KEY"
  printf 'OPENROUTER_SONNET_4_5_KEY=%s\n' "$OPENROUTER_SONNET_4_5_KEY"
  printf 'OPENROUTER_GEMINI_2_5_FLASH_KEY=%s\n' "$OPENROUTER_GEMINI_2_5_FLASH_KEY"
  printf 'ANTHROPIC_API_KEY=%s\n' "$ANTHROPIC_API_KEY"
  printf 'GEMINI_API_KEY=%s\n' "$GEMINI_API_KEY"
  printf 'OPENAI_API_KEY=%s\n' "${OPENAI_API_KEY:-}"
} > "$ROOT_DIR/.env.joni"
echo "✅ .env.joni created"

# Only add env_file to docker-compose if not already present
if [[ -f "$ROOT_DIR/docker-compose.yml" ]]; then
  if ! grep -q 'env_file:.*\.env\.joni' "$ROOT_DIR/docker-compose.yml"; then
    sed -i.bak '/^    image:/a\    env_file: .env.joni' "$ROOT_DIR/docker-compose.yml" || true
    echo "✅ docker-compose.yml patched (env_file: .env.joni)"
  else
    echo "✅ docker-compose.yml already has env_file: .env.joni"
  fi
fi

echo ""
echo "🛑 Freeing port 18890 (stop this project + any container using it)..."
docker compose down 2>/dev/null || true
# Stop any other container holding 18890 (e.g. from another JONI clone or project)
for cid in $(docker ps -q 2>/dev/null); do
  if docker port "$cid" 2>/dev/null | grep -q '18890'; then
    docker stop "$cid" 2>/dev/null || true
  fi
done

echo ""
echo "🚀 Building JONI Docker image (may take 5–10 min)..."
chmod +x docker-setup.sh
if groups | grep -q docker 2>/dev/null; then
  ./docker-setup.sh
else
  sg docker -c './docker-setup.sh' 2>/dev/null || ./docker-setup.sh
fi

echo ""
echo "📌 Setting default model to OpenRouter Sonnet 4.5..."
docker compose run --rm joni-cli models set openrouter/anthropic/claude-sonnet-4-5 || true

echo ""
echo "📌 Patching config for OpenRouter provider + image model + audio..."
cat > "$ROOT_DIR/patch-openrouter-provider.js" << 'JSEOF'
const fs=require("fs");
const p="/home/node/.joni/joni.json";
let c={};
try{c=JSON.parse(fs.readFileSync(p,"utf8"));}catch(e){}
c.models=c.models||{};
c.models.providers=c.models.providers||{};
const or=c.models.providers.openrouter||{};c.models.providers.openrouter={baseUrl:"https://openrouter.ai/api/v1",api:"openai-completions",models:Array.isArray(or.models)?or.models:[],...or};
c.agents=c.agents||{};c.agents.defaults=c.agents.defaults||{};
if(!c.agents.defaults.imageModel?.primary){c.agents.defaults.imageModel={primary:"openrouter/google/gemini-3-pro-image-preview",fallbacks:["openrouter/google/gemini-2.0-flash-vision:free","openrouter/qwen/qwen-2.5-vl-72b-instruct:free"]};}
if(!c.tools)c.tools={};if(!c.tools.media)c.tools.media={};if(!c.tools.media.audio)c.tools.media.audio={enabled:true,models:[{provider:"openai",model:"whisper-1"}]};
var openaiKey=process.env.OPENAI_API_KEY||"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";
if(openaiKey){c.models.providers.openai=c.models.providers.openai||{};c.models.providers.openai.baseUrl=c.models.providers.openai.baseUrl||"https://api.openai.com/v1";c.models.providers.openai.apiKey=openaiKey;c.models.providers.openai.models=Array.isArray(c.models.providers.openai.models)?c.models.providers.openai.models:[];c.skills=c.skills||{};c.skills.entries=c.skills.entries||{};c.skills.entries["openai-whisper-api"]=c.skills.entries["openai-whisper-api"]||{};c.skills.entries["openai-whisper-api"].apiKey=openaiKey;}
fs.writeFileSync(p,JSON.stringify(c,null,2));
JSEOF
docker compose run --rm -v "$ROOT_DIR/patch-openrouter-provider.js:/tmp/patch.js:ro" --entrypoint sh joni-cli -c "node /tmp/patch.js" || true
rm -f "$ROOT_DIR/patch-openrouter-provider.js"

# Ensure .env.joni has OPENAI_API_KEY for voice (gateway checks env first). Use preset if still empty.
if ! grep -q '^OPENAI_API_KEY=.\+' "$ROOT_DIR/.env.joni" 2>/dev/null; then
  OPENAI_PRESET="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"
  sed -i.bak 's/^OPENAI_API_KEY= *$/OPENAI_API_KEY='"$OPENAI_PRESET"'/' "$ROOT_DIR/.env.joni" 2>/dev/null || true
  grep -q '^OPENAI_API_KEY=.\+' "$ROOT_DIR/.env.joni" || echo "OPENAI_API_KEY=$OPENAI_PRESET" >> "$ROOT_DIR/.env.joni"
  echo "✅ Set OPENAI_API_KEY in .env.joni for voice transcription (preset)."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ JONI installed and running locally!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Gateway: http://127.0.0.1:18890"
echo ""
echo "  Voice transcription: OPENAI_API_KEY is in .env.joni (and in ~/.joni/joni.json)."
echo "  If voice still fails, restart the gateway: docker compose restart joni-gateway"
echo "  Image generation: uses OpenRouter (agents.defaults.imageModel) with OPENROUTER_API_KEY."
echo ""
echo "  Run JONI commands from this directory (the global 'joni' CLI may point elsewhere):"
echo "    cd $ROOT_DIR"
echo "    docker compose run --rm joni-cli status"
echo "    docker compose run --rm joni-cli logs --follow"
echo "    docker compose run --rm joni-cli agents list"
echo "  Or:  docker compose -f $ROOT_DIR/docker-compose.yml run --rm joni-cli <command>"
echo ""
