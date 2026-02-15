FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

ARG JONI_DOCKER_APT_PACKAGES=""
RUN if [ -n "$JONI_DOCKER_APT_PACKAGES" ]; then \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $JONI_DOCKER_APT_PACKAGES && \
      apt-get clean && \
      rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
    fi

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY patches ./patches
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .

# Note: .env.joni is NOT copied into the image (contains secrets)
# It will be mounted at runtime via docker-compose volume mount

RUN JONI_A2UI_SKIP_MISSING=1 pnpm build
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV JONI_PREFER_PNPM=1
RUN pnpm ui:build

ENV NODE_ENV=production
ENV ENV_FILE=/app/.env.joni

# Allow non-root user to write temp files during runtime/tests.
RUN chown -R node:node /app

# Security hardening: Run as non-root user
# The node:22-bookworm image includes a 'node' user (uid 1000)
# This reduces the attack surface by preventing container escape via root privileges
USER node

# Start gateway server with default config.
# Binds to loopback (127.0.0.1) by default for security.
#
# For container platforms requiring external health checks:
#   1. Set JONI_GATEWAY_TOKEN or JONI_GATEWAY_PASSWORD env var
#   2. Override CMD: ["node","joni.mjs","gateway","--allow-unconfigured","--bind","lan"]
CMD ["node", "joni.mjs", "gateway", "--allow-unconfigured"]
