# =============================================================================
# Dockerfile for agent-server (Bun runtime)
# Build from repository root: fly deploy --dockerfile apps/agent-server/Dockerfile
# =============================================================================

# Base image with Bun
FROM oven/bun:1 AS base
WORKDIR /app

# =============================================================================
# Stage 1: Install dependencies
# =============================================================================
FROM base AS install

# Copy root package files for workspace resolution
COPY package.json bun.lock ./

# Copy workspace package.json files (needed for bun install)
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/agent-server/package.json ./apps/agent-server/

# Install all dependencies (production only)
RUN bun install --frozen-lockfile --production

# =============================================================================
# Stage 2: Build/prepare the application
# =============================================================================
FROM base AS build

# Copy installed dependencies
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true
COPY --from=install /app/packages/db/node_modules ./packages/db/node_modules 2>/dev/null || true
COPY --from=install /app/apps/agent-server/node_modules ./apps/agent-server/node_modules 2>/dev/null || true

# Copy all source files needed
COPY package.json bun.lock ./
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/agent-server ./apps/agent-server

# =============================================================================
# Stage 3: Production release
# =============================================================================
FROM base AS release

# Copy everything from build stage
COPY --from=build /app ./

# Set working directory to agent-server
WORKDIR /app/apps/agent-server

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs && \
    chown -R bunjs:nodejs /app

USER bunjs

# Expose the port
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Run the server
CMD ["bun", "run", "server.ts"]
