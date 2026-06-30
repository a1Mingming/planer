# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# better-sqlite3 is a native module — node-gyp needs python3/make/g++ to compile it
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm build

# ── Stage 2: production runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runner

# Build tools also needed in runner: pnpm --prod reinstalls better-sqlite3
# and recompiles its .node binary for this exact Alpine/Node version.
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production \
    PORT=3001 \
    DB_PATH=/app/data/plans.db

RUN mkdir -p /app/data

EXPOSE 3001
CMD ["node", "dist/interface/index.js"]
