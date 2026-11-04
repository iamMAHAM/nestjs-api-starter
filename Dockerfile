# syntax=docker/dockerfile:1

# --- deps --------------------------------------------------------------------
FROM oven/bun:1.4.4-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

# --- build -------------------------------------------------------------------
FROM oven/bun:1.4.4-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate && bun run build

# --- migrate -----------------------------------------------------------------
# docker build --target migrate -t api-migrate . && docker run -e DATABASE_URL=… api-migrate
FROM build AS migrate
ENV PRISMA_HIDE_UPDATE_MESSAGE=1
CMD ["bun", "run", "db:deploy"]

# --- prod deps ---------------------------------------------------------------
FROM oven/bun:1.4.4-alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

# --- runtime -----------------------------------------------------------------
FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nestjs -G nodejs

COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --chown=nestjs:nodejs package.json ./

USER nestjs
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -qO /dev/null "http://127.0.0.1:${PORT}/health" || exit 1
CMD ["node", "dist/main.js"]
