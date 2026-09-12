# syntax=docker/dockerfile:1

# One Dockerfile, one target per process. Build from the repo root:
#   docker build --target api -t vexio-api .
#   docker build --target ws  -t vexio-ws  .
#   docker build --target web --build-arg NEXT_PUBLIC_AUTH_URL=... -t vexio-web .
# `docker compose up` (bun run docker:up) builds all three — see docker-compose.yml.
# Cloud Build (cloudbuild.*.yaml) targets `api` / `ws` by name; keep those names.

FROM oven/bun:1.3.14 AS application

WORKDIR /app

# Copy only the manifests first so the dependency layer is cached until a
# package.json or the lockfile changes.
COPY package.json bun.lock .npmrc ./
COPY apps/web/package.json apps/web/
COPY apps/http-server/package.json apps/http-server/
COPY apps/ws-server/package.json apps/ws-server/
COPY packages/auth/package.json packages/auth/
COPY packages/common/package.json packages/common/
COPY packages/db/package.json packages/db/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/tailwind-config/package.json packages/tailwind-config/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/
COPY packages/ws-schema/package.json packages/ws-schema/
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked bun install

COPY . .

# Prisma generation is a build-time operation and does not contact Postgres.
# The placeholder only satisfies prisma.config.ts; real connection strings are
# supplied at runtime (compose env_file, Cloud Run secrets, Render env vars).
RUN DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    bun run --cwd packages/db generate

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

FROM application AS web

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# they must be passed as build args, not runtime env.
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:8000
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8080
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

RUN bun run --cwd apps/web build

ENV NODE_ENV=production
# `next start` reads PORT; without it Next defaults to 3000.
ENV PORT=3001

EXPOSE 3001

CMD ["bun", "run", "--cwd", "apps/web", "start"]
