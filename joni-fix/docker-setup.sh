#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
EXTRA_COMPOSE_FILE="$ROOT_DIR/docker-compose.extra.yml"
IMAGE_NAME="${JONI_IMAGE:-joni:local}"
EXTRA_MOUNTS="${JONI_EXTRA_MOUNTS:-}"
HOME_VOLUME_NAME="${JONI_HOME_VOLUME:-}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing dependency: $1" >&2
    exit 1
  fi
}

require_cmd docker
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose not available (try: docker compose version)" >&2
  exit 1
fi

JONI_CONFIG_DIR="${JONI_CONFIG_DIR:-$HOME/.joni}"
JONI_WORKSPACE_DIR="${JONI_WORKSPACE_DIR:-$HOME/.joni/workspace}"

mkdir -p "$JONI_CONFIG_DIR"
mkdir -p "$JONI_WORKSPACE_DIR"

export JONI_CONFIG_DIR
export JONI_WORKSPACE_DIR
export JONI_GATEWAY_PORT="${JONI_GATEWAY_PORT:-18890}"
export JONI_BRIDGE_PORT="${JONI_BRIDGE_PORT:-18891}"
export JONI_GATEWAY_BIND="${JONI_GATEWAY_BIND:-lan}"
export JONI_IMAGE="$IMAGE_NAME"
export JONI_DOCKER_APT_PACKAGES="${JONI_DOCKER_APT_PACKAGES:-}"
export JONI_EXTRA_MOUNTS="$EXTRA_MOUNTS"
export JONI_HOME_VOLUME="$HOME_VOLUME_NAME"

if [[ -z "${JONI_GATEWAY_TOKEN:-}" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    JONI_GATEWAY_TOKEN="$(openssl rand -hex 32)"
  else
    JONI_GATEWAY_TOKEN="$(python3 - <<'PY'
import secrets
print(secrets.token_hex(32))
PY
)"
  fi
fi
export JONI_GATEWAY_TOKEN

COMPOSE_FILES=("$COMPOSE_FILE")
COMPOSE_ARGS=()

write_extra_compose() {
  local home_volume="$1"
  shift
  local -a mounts=("$@")
  local mount

  cat >"$EXTRA_COMPOSE_FILE" <<'YAML'
services:
  joni-gateway:
    volumes:
YAML

  if [[ -n "$home_volume" ]]; then
    printf '      - %s:/home/node\n' "$home_volume" >>"$EXTRA_COMPOSE_FILE"
    printf '      - %s:/home/node/.joni\n' "$JONI_CONFIG_DIR" >>"$EXTRA_COMPOSE_FILE"
    printf '      - %s:/home/node/.joni/workspace\n' "$JONI_WORKSPACE_DIR" >>"$EXTRA_COMPOSE_FILE"
  fi

  for mount in "${mounts[@]}"; do
    printf '      - %s\n' "$mount" >>"$EXTRA_COMPOSE_FILE"
  done

  cat >>"$EXTRA_COMPOSE_FILE" <<'YAML'
  joni-cli:
    volumes:
YAML

  if [[ -n "$home_volume" ]]; then
    printf '      - %s:/home/node\n' "$home_volume" >>"$EXTRA_COMPOSE_FILE"
    printf '      - %s:/home/node/.joni\n' "$JONI_CONFIG_DIR" >>"$EXTRA_COMPOSE_FILE"
    printf '      - %s:/home/node/.joni/workspace\n' "$JONI_WORKSPACE_DIR" >>"$EXTRA_COMPOSE_FILE"
  fi

  for mount in "${mounts[@]}"; do
    printf '      - %s\n' "$mount" >>"$EXTRA_COMPOSE_FILE"
  done

  if [[ -n "$home_volume" && "$home_volume" != *"/"* ]]; then
    cat >>"$EXTRA_COMPOSE_FILE" <<YAML
volumes:
  ${home_volume}:
YAML
  fi
}

VALID_MOUNTS=()
if [[ -n "$EXTRA_MOUNTS" ]]; then
  IFS=',' read -r -a mounts <<<"$EXTRA_MOUNTS"
  for mount in "${mounts[@]}"; do
    mount="${mount#"${mount%%[![:space:]]*}"}"
    mount="${mount%"${mount##*[![:space:]]}"}"
    if [[ -n "$mount" ]]; then
      VALID_MOUNTS+=("$mount")
    fi
  done
fi

if [[ -n "$HOME_VOLUME_NAME" || ${#VALID_MOUNTS[@]} -gt 0 ]]; then
  write_extra_compose "$HOME_VOLUME_NAME" "${VALID_MOUNTS[@]}"
  COMPOSE_FILES+=("$EXTRA_COMPOSE_FILE")
fi
for compose_file in "${COMPOSE_FILES[@]}"; do
  COMPOSE_ARGS+=("-f" "$compose_file")
done
COMPOSE_HINT="docker compose"
for compose_file in "${COMPOSE_FILES[@]}"; do
  COMPOSE_HINT+=" -f ${compose_file}"
done

ENV_FILE="$ROOT_DIR/.env"
upsert_env() {
  local file="$1"
  shift
  local -a keys=("$@")
  local tmp
  tmp="$(mktemp)"
  local seen=""

  if [[ -f "$file" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      local key="${line%%=*}"
      local replaced=false
      for k in "${keys[@]}"; do
        if [[ "$key" == "$k" ]]; then
          printf '%s=%s\n' "$k" "${!k-}" >>"$tmp"
          seen="$seen|$k|"
          replaced=true
          break
        fi
      done
      if [[ "$replaced" == false ]]; then
        printf '%s\n' "$line" >>"$tmp"
      fi
    done <"$file"
  fi

  for k in "${keys[@]}"; do
    if [[ "$seen" != *"|$k|"* ]]; then
      printf '%s=%s\n' "$k" "${!k-}" >>"$tmp"
    fi
  done

  mv "$tmp" "$file"
}

upsert_env "$ENV_FILE" \
  JONI_CONFIG_DIR \
  JONI_WORKSPACE_DIR \
  JONI_GATEWAY_PORT \
  JONI_BRIDGE_PORT \
  JONI_GATEWAY_BIND \
  JONI_GATEWAY_TOKEN \
  JONI_IMAGE \
  JONI_EXTRA_MOUNTS \
  JONI_HOME_VOLUME \
  JONI_DOCKER_APT_PACKAGES

echo "==> Building Docker image: $IMAGE_NAME"
docker build \
  --build-arg "JONI_DOCKER_APT_PACKAGES=${JONI_DOCKER_APT_PACKAGES}" \
  -t "$IMAGE_NAME" \
  -f "$ROOT_DIR/Dockerfile" \
  "$ROOT_DIR"

echo ""
echo "==> Auto-configuring JONI..."

# Check for .env.joni
if [[ ! -f "$ROOT_DIR/.env.joni" ]]; then
  echo "⚠️  ERROR: .env.joni not found!"
  echo ""
  echo "Create .env.joni in $ROOT_DIR with your API keys:"
  echo ""
  echo "cat > .env.joni << 'EOF'"
  echo "ANTHROPIC_API_KEY=your-key-here"
  echo "GEMINI_API_KEY=your-key-here"
  echo "OPENAI_API_KEY=your-key-here"
  echo "EOF"
  echo ""
  exit 1
fi

# Load API keys
source "$ROOT_DIR/.env.joni"

echo "✅ API keys loaded from .env.joni"
echo "📋 Running fully automated onboarding..."
echo ""

# Run automated onboard: use OpenRouter with Sonnet 4.5 (uses OPENROUTER_API_KEY)
# Pass OPENAI_API_KEY so voice transcription (Whisper) is configured
ONBOARD_EXTRA=()
[[ -n "${OPENAI_API_KEY:-}" ]] && ONBOARD_EXTRA+=(--openai-api-key "${OPENAI_API_KEY}")
docker compose "${COMPOSE_ARGS[@]}" run --rm \
  -e ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
  -e GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
  -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
  -e OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}" \
  joni-cli onboard \
    --non-interactive \
    --accept-risk \
    --flow quickstart \
    --mode local \
    --auth-choice openrouter-api-key \
    --openrouter-api-key "${OPENROUTER_API_KEY:-}" \
    --default-model "openrouter/anthropic/claude-sonnet-4-5" \
    "${ONBOARD_EXTRA[@]}" \
    --no-install-daemon \
    --skip-channels \
    --skip-health

echo ""
echo "✅ JONI configured successfully!"

echo ""
echo "==> Starting JONI Gateway..."
docker compose "${COMPOSE_ARGS[@]}" up -d joni-gateway

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 JONI is running!"
echo ""
echo "📋 Configuration:"
echo "   - Port: 18890 (default)"
echo "   - Config: $JONI_CONFIG_DIR"
echo "   - Workspace: $JONI_WORKSPACE_DIR"
echo "   - Auth Token: $JONI_GATEWAY_TOKEN"
echo ""
echo "🚀 Quick Commands:"
echo "   View logs:"
echo "     ${COMPOSE_HINT} logs -f joni-gateway"
echo ""
echo "   Chat with JONI:"
echo "     ${COMPOSE_HINT} run --rm joni-cli"
echo ""
echo "   Health check:"
echo "     ${COMPOSE_HINT} exec joni-gateway node dist/index.js health --token \"$JONI_GATEWAY_TOKEN\""
echo ""
echo "   Add Telegram bot (optional):"
echo "     ${COMPOSE_HINT} run --rm joni-cli channels add --channel telegram --token <bot-token>"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
