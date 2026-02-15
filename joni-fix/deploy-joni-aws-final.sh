#!/usr/bin/env bash
set -euo pipefail

# JONI AWS One-Command Deployment
# Creates EC2 instance + installs JONI from GitHub (TokenTimes/JONI-BRAIN).
# For local install use install-joni-docker.sh instead.
#
# Usage: ./deploy-joni-aws-final.sh [username]

# Get username from first argument, default to "user" if not provided
USERNAME="${1:-user}"

# Sanitize username (already done in frontend, but double-check)
USERNAME=$(echo "$USERNAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | sed 's/^-\|-$//g')

AWS_REGION="${AWS_REGION:-us-east-1}"
INSTANCE_TYPE="t3.medium"  # 4GB RAM (t3.small has only 2GB and fails)
KEY_NAME="joni-key"
# PAT for cloning JONI-BRAIN (private repo). Override with env GITHUB_PAT if needed.
GITHUB_PAT="${GITHUB_PAT:-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}"

echo "🚀 JONI AWS One-Command Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📛 Username: $USERNAME"
echo ""

# API keys must be passed from JONI Deployer (no local .env): 2 new OpenRouter keys + constant OpenAI
if [[ -z "${OPENROUTER_SONNET_4_5_KEY:-}" ]]; then
  echo "❌ Missing OPENROUTER_SONNET_4_5_KEY (run from JONI Deployer to get new \$50 keys)"
  exit 1
fi
if [[ -z "${OPENROUTER_GEMINI_2_5_FLASH_KEY:-}" ]]; then
  echo "❌ Missing OPENROUTER_GEMINI_2_5_FLASH_KEY (Gemini/Whisper key from deployer)"
  exit 1
fi
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "❌ Missing OPENAI_API_KEY (set OPENAI_API_KEY in deployer .env)"
  exit 1
fi
echo "✅ API keys received from deployer (OpenRouter Sonnet 4.5 + Gemini + OpenAI constant)"
echo ""

# Create/check SSH key
KEY_FILE="$HOME/.ssh/${KEY_NAME}.pem"
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$AWS_REGION" &>/dev/null; then
  echo "🔑 Creating SSH key pair: $KEY_NAME"
  aws ec2 create-key-pair \
    --key-name "$KEY_NAME" \
    --region "$AWS_REGION" \
    --query 'KeyMaterial' \
    --output text > "$KEY_FILE"
  chmod 400 "$KEY_FILE"
  echo "✅ Key saved: $KEY_FILE"
else
  echo "✅ Using existing key: $KEY_NAME"
  if [[ ! -f "$KEY_FILE" ]]; then
    echo "❌ Key file not found: $KEY_FILE"
    echo "Delete key pair in AWS and re-run, or provide existing .pem file"
    exit 1
  fi
fi

# Get/create security group
SG_NAME="joni-sg"
SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=$SG_NAME" \
  --region "$AWS_REGION" \
  --query 'SecurityGroups[0].GroupId' \
  --output text 2>/dev/null || echo "")

if [[ "$SG_ID" == "None" || -z "$SG_ID" ]]; then
  echo "🔒 Creating security group: $SG_NAME"
  SG_ID=$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "JONI security group (SSH + Gateway)" \
    --region "$AWS_REGION" \
    --query 'GroupId' \
    --output text)
  
  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 22 --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" >/dev/null
  
  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 18890 --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" >/dev/null
  
  echo "✅ Security group: $SG_ID"
else
  echo "✅ Using security group: $SG_ID"
fi

# Get Ubuntu 24.04 AMI
echo "🔍 Finding Ubuntu 24.04 AMI..."
AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" \
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
  --output text \
  --region "$AWS_REGION")

echo "✅ AMI: $AMI_ID"
echo ""

# Launch instance with 20GB disk and custom name
INSTANCE_NAME="JONI-${USERNAME}"
echo "🚀 Launching EC2 instance ($INSTANCE_TYPE with 20GB disk)..."
echo "📝 Instance name: $INSTANCE_NAME"
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --region "$AWS_REGION" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}}]" \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "✅ Instance: $INSTANCE_ID"
echo ""

# Wait for instance
echo "⏳ Waiting for instance to start..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "✅ Instance running!"
echo "   Instance ID: $INSTANCE_ID"
echo "   Public IP: $PUBLIC_IP"
echo ""

# Wait for SSH
SSH_HOST="ubuntu@$PUBLIC_IP"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 -i "$KEY_FILE")

echo "⏳ Waiting for SSH (30-60 seconds)..."
for i in {1..30}; do
  if ssh "${SSH_OPTS[@]}" "$SSH_HOST" "echo ready" &>/dev/null; then
    echo "✅ SSH ready!"
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "❌ SSH timeout"
    exit 1
  fi
  sleep 5
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Installing JONI from GitHub (TokenTimes/JONI-BRAIN)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create remote installation script
INSTALL_SCRIPT=$(cat <<'REMOTE'
#!/usr/bin/env bash
set -euo pipefail

echo "🐳 Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
  echo "✅ Docker installed"
else
  echo "✅ Docker already installed"
fi

echo ""
echo "🔧 Verifying Docker Compose..."
docker compose version >/dev/null 2>&1 || {
  echo "❌ Docker Compose not available"
  exit 1
}
echo "✅ Docker Compose ready"

echo ""
__JONI_SOURCE_BLOCK__

echo ""
echo "🔑 Creating .env.joni (OpenRouter Sonnet 4.5 + Gemini/Whisper + OpenAI constant)..."
cat > .env.joni << 'ENV'
OPENROUTER_API_KEY=__OPENROUTER_SONNET__
OPENROUTER_SONNET_4_5_KEY=__OPENROUTER_SONNET__
OPENROUTER_GEMINI_2_5_FLASH_KEY=__OPENROUTER_GEMINI__
ANTHROPIC_API_KEY=__OPENROUTER_SONNET__
GEMINI_API_KEY=__OPENROUTER_GEMINI__
OPENAI_API_KEY=__OPENAI__
ENV
echo "✅ .env.joni created"

# So gateway and CLI get API keys at runtime (OPENROUTER_API_KEY etc.)
# Only add env_file if not already present (local source often has it; avoid duplicate key)
if [[ -f docker-compose.yml ]]; then
  if ! grep -q 'env_file:.*\.env\.joni' docker-compose.yml; then
    sed -i.bak '/^    image:/a\    env_file: .env.joni' docker-compose.yml || true
    echo "✅ docker-compose.yml patched (env_file: .env.joni)"
  else
    echo "✅ docker-compose.yml already has env_file: .env.joni"
  fi
fi

echo ""
echo "🚀 Building JONI Docker image (5-10 minutes)..."
chmod +x docker-setup.sh
# Use sg to run with docker group without logout
sg docker -c './docker-setup.sh'

# Set default model to OpenRouter Sonnet 4.5 (uses OPENROUTER_API_KEY from .env.joni)
sg docker -c 'docker compose run --rm joni-cli models set openrouter/anthropic/claude-sonnet-4-5' || true

# Ensure OpenRouter provider + image model in config (fixes "Unknown model" and image generation)
# joni-cli default entrypoint is the CLI; use --entrypoint sh so node runs inside the container
JONI_DIR="$(pwd)"
cat > "$JONI_DIR/patch-openrouter-provider.js" << 'JSEOF'
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
sg docker -c "docker compose run --rm -v $JONI_DIR/patch-openrouter-provider.js:/tmp/patch.js:ro --entrypoint sh joni-cli -c 'node /tmp/patch.js'" || true
rm -f "$JONI_DIR/patch-openrouter-provider.js"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ JONI deployment complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Quick commands:"
echo "  View logs:  docker compose -f ~/JONI/docker-compose.yml logs -f joni-gateway"
echo "  Chat:       docker compose -f ~/JONI/docker-compose.yml run --rm joni-cli"
echo "  Stop:       docker compose -f ~/JONI/docker-compose.yml down"
echo ""
echo "🌐 Gateway: http://__PUBLIC_IP__:18890"
echo ""
REMOTE
)

# Clone from GitHub (with PAT if private repo)
if [[ -n "${GITHUB_PAT:-}" ]]; then
  JONI_CLONE_URL="https://${GITHUB_PAT}@github.com/TokenTimes/JONI-BRAIN.git"
else
  JONI_CLONE_URL="https://github.com/TokenTimes/JONI-BRAIN.git"
fi
JONI_SOURCE_BLOCK="echo \"📥 Cloning JONI from GitHub (TokenTimes/JONI-BRAIN)...\"
[[ -d JONI ]] && rm -rf JONI
export GIT_TERMINAL_PROMPT=0
git clone \"$JONI_CLONE_URL\" JONI
cd JONI"

INSTALL_SCRIPT="${INSTALL_SCRIPT//__JONI_SOURCE_BLOCK__/$JONI_SOURCE_BLOCK}"

INSTALL_SCRIPT="${INSTALL_SCRIPT//__OPENROUTER_SONNET__/$OPENROUTER_SONNET_4_5_KEY}"
INSTALL_SCRIPT="${INSTALL_SCRIPT//__OPENROUTER_GEMINI__/$OPENROUTER_GEMINI_2_5_FLASH_KEY}"
INSTALL_SCRIPT="${INSTALL_SCRIPT//__OPENAI__/$OPENAI_API_KEY}"
INSTALL_SCRIPT="${INSTALL_SCRIPT//__PUBLIC_IP__/$PUBLIC_IP}"

# Upload & run
echo "📤 Uploading installation script..."
echo "$INSTALL_SCRIPT" | ssh "${SSH_OPTS[@]}" "$SSH_HOST" "cat > install-joni.sh && chmod +x install-joni.sh"

echo "✅ Uploaded"
echo ""
echo "🚀 Running installation (this will take 10-15 minutes)..."
echo ""

ssh "${SSH_OPTS[@]}" "$SSH_HOST" "./install-joni.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 JONI is live!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Instance Details:"
echo "   Instance ID: $INSTANCE_ID"
echo "   Public IP:   $PUBLIC_IP"
echo "   Region:      $AWS_REGION"
echo "   SSH:         ssh -i $KEY_FILE $SSH_HOST"
echo ""
echo "🌐 Gateway:"
echo "   http://$PUBLIC_IP:18890"
echo ""
echo "📱 Next steps:"
echo "  1. View logs:    ssh -i $KEY_FILE $SSH_HOST"
echo "                   docker compose -f ~/JONI/docker-compose.yml logs -f joni-gateway"
echo ""
echo "  2. Add Telegram: docker compose -f ~/JONI/docker-compose.yml run --rm joni-cli channels add --channel telegram --token <bot-token>"
echo ""
