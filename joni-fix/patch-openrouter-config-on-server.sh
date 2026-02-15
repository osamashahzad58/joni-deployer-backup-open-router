#!/usr/bin/env bash
# Run this ON THE SERVER (e.g. ubuntu@ip-172-31-29-21) inside ~/JONI to fix "Unknown model: openrouter/anthropic/claude-sonnet-4-5".
# Usage: cd ~/JONI && bash patch-openrouter-config-on-server.sh
# Then: docker compose -f ~/JONI/docker-compose.yml restart joni-gateway

set -euo pipefail
cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"

cat > "$SCRIPT_DIR/patch-openrouter-provider.js" << 'JSEOF'
const fs=require("fs");
const p="/home/node/.joni/joni.json";
let c={};
try{c=JSON.parse(fs.readFileSync(p,"utf8"));}catch(e){}
c.models=c.models||{};
c.models.providers=c.models.providers||{};
const or=c.models.providers.openrouter||{};c.models.providers.openrouter={baseUrl:"https://openrouter.ai/api/v1",api:"openai-completions",models:Array.isArray(or.models)?or.models:[],...or};
fs.writeFileSync(p,JSON.stringify(c,null,2));
JSEOF

docker compose -f "$SCRIPT_DIR/docker-compose.yml" run --rm \
  -v "$SCRIPT_DIR/patch-openrouter-provider.js:/tmp/patch.js:ro" \
  --entrypoint sh joni-cli -c "node /tmp/patch.js"

rm -f "$SCRIPT_DIR/patch-openrouter-provider.js"
echo "Done. Restart gateway: docker compose -f $SCRIPT_DIR/docker-compose.yml restart joni-gateway"
