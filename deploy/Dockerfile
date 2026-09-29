# syntax=docker/dockerfile:1.7
# One Dockerfile, three runtime targets: server (api + worker + init), web.
# Workspace packages stay as symlinked TypeScript sources: Node strips types at runtime,
# but refuses .ts under node_modules, which rules out `pnpm deploy`.

FROM node:26-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN npm install -g pnpm@12.14.0 turbo@2.11.10 && npm cache clean --force
WORKDIR /app

FROM base AS pruner-server
COPY . .
RUN turbo prune @entitled/api @entitled/worker --docker

FROM base AS pruner-web
COPY . .
RUN turbo prune @entitled/web --docker

FROM base AS server-build
COPY --from=pruner-server /app/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts
COPY --from=pruner-server /app/out/full/ .

FROM node:26-slim AS server
ENV NODE_ENV=production
WORKDIR /app
COPY --from=server-build --chown=node:node /app /app
USER node
CMD ["node", "apps/api/src/main.ts"]

FROM base AS web-build
COPY --from=pruner-web /app/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
COPY --from=pruner-web /app/out/full/ .
RUN pnpm --filter @entitled/web build

FROM node:26-slim AS web
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=web-build --chown=node:node /app/apps/web/.output /app
USER node
EXPOSE 3000
CMD ["node", "server/index.mjs"]
