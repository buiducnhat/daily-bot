FROM oven/bun:1 AS base

FROM base AS builder
WORKDIR /app
RUN bun install -g turbo@^2
COPY . .
RUN turbo prune server --docker

FROM base AS installer
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/bun.lock ./bun.lock
RUN bun install

# Build the project
COPY --from=builder /app/out/full/ .
RUN bun run build -F server

FROM base AS runner
WORKDIR /app

# Copy built application
COPY --from=installer /app/apps/server/server ./apps/server/server
COPY --from=installer /app/apps/server/package.json ./apps/server/package.json
COPY --from=installer /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=installer /app/packages ./packages
COPY --from=installer /app/node_modules ./node_modules

WORKDIR /app/apps/server

EXPOSE 34243

CMD ["./server"]
