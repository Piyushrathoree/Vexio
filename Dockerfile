# syntax=docker/dockerfile:1

# One container definition, with separate targets for the HTTP API and the
# WebSocket process. Cloud Build chooses the target explicitly.
FROM oven/bun:1.3.4 AS application

WORKDIR /app

COPY . .

# Bun uses bun.lock for resolution. `--no-save` prevents this image build from
# silently changing that graph (the legacy lockfile trips a false positive with
# Bun's `--frozen-lockfile` validation despite a no-op normal resolution).
RUN bun install --no-save

# Prisma generation is a build-time operation and does not contact Postgres.
# The placeholder only satisfies prisma.config.ts; real connection strings are
# supplied to Cloud Run from Secret Manager at runtime.
RUN DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    bun --cwd packages/db run generate

FROM application AS api

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["bun", "run", "apps/http-server/index.ts"]

FROM application AS ws

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["bun", "run", "apps/ws-server/index.ts"]
