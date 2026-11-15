# Production image for the Banya/Parka portal.
#
# The app uses a custom Node server (server.js) for the WebSocket chat, so the
# runtime ships the full Next.js build + production node_modules and starts the
# server through tsx (the server dynamically requires TS modules from src/).

FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholders only. Real secrets are injected at runtime via env.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build \
    JWT_SECRET=build-time-placeholder-secret-000000000000 \
    JWT_REFRESH_SECRET=build-time-placeholder-refresh-0000000000 \
    NEXT_PUBLIC_APP_URL=https://banya.3set.online \
    TWILIO_ACCOUNT_SID=AC00000000000000000000000000000000 \
    TWILIO_AUTH_TOKEN=build-time-placeholder \
    TWILIO_FROM_NUMBER=+10000000000
RUN npx prisma generate
RUN npm run build
RUN rm -rf .next/cache

FROM node:20-bookworm-slim AS prod-deps
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --chown=nextjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nodejs --from=prod-deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs --from=builder /app/.next ./.next
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs --from=builder /app/src ./src
COPY --chown=nextjs:nodejs --from=builder /app/server.js ./server.js
COPY --chown=nextjs:nodejs --from=builder /app/next.config.js ./next.config.js
COPY --chown=nextjs:nodejs --from=builder /app/next.config.ts ./next.config.ts
COPY --chown=nextjs:nodejs --from=builder /app/tsconfig.json ./tsconfig.json

RUN rm -rf .next/cache
USER nextjs
EXPOSE 3000
CMD ["node", "--import", "tsx", "server.js"]
