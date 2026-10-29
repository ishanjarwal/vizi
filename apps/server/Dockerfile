# -------------------------------------------------------------
# Stage 1: Base image with pnpm
# -------------------------------------------------------------
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

# -------------------------------------------------------------
# Stage 2: Dependencies & Build
# -------------------------------------------------------------
FROM base AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy workspace package manifests for cached dependency installation
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/typescript-config ./packages/typescript-config
COPY packages/eslint-config ./packages/eslint-config
COPY packages/protocol ./packages/protocol
COPY apps/server ./apps/server

# Build shared protocol library
RUN pnpm --filter @vizi/protocol build

# Generate Prisma Client and build server bundle
WORKDIR /app/apps/server
ENV DATABASE_URL="postgresql://test:test@test:0000/test"
RUN pnpm prisma:generate
RUN pnpm build

# -------------------------------------------------------------
# Stage 3: Production Runner
# -------------------------------------------------------------
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends openssl wget ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

# Create non-root system user for security with home directory
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --create-home --home-dir /home/vizi -g nodejs vizi

# Copy build artifacts and dependencies with non-root ownership
COPY --from=builder --chown=vizi:nodejs /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder --chown=vizi:nodejs /app/packages/protocol ./packages/protocol
COPY --from=builder --chown=vizi:nodejs /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder --chown=vizi:nodejs /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder --chown=vizi:nodejs /app/apps/server/prisma.config.ts ./apps/server/prisma.config.ts
COPY --from=builder --chown=vizi:nodejs /app/apps/server/dist ./apps/server/dist
COPY --from=builder --chown=vizi:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=vizi:nodejs /app/apps/server/node_modules ./apps/server/node_modules

# Copy entrypoint script
COPY --chmod=755 apps/server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER vizi
WORKDIR /app/apps/server

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
