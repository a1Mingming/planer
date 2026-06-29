# ── Stage 1: build Umi SPA ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY .umirc.ts tsconfig.json typings.d.ts ./
COPY src/ ./src/

# NODE_ENV=production disables the dev proxy and enables production optimizations.
# The .umirc.ts proxy block only applies to the Umi dev server, not the build output.
ENV NODE_ENV=production
RUN pnpm build

# ── Stage 2: Nginx static server ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/app.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
