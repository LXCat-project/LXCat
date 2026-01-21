# SPDX-FileCopyrightText: LXCat team
# SPDX-License-Identifier: AGPL-3.0-or-later

# Install dependencies only when needed
FROM node:24-alpine AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git rust cargo
# Enable corepack for pnpm version management.
RUN corepack enable

WORKDIR /code
COPY . .
RUN bun install --frozen-lockfile

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN bun run build --no-cache

# Production image, copy all the files and run next
WORKDIR /code/app

ENV NODE_ENV production
ENV LXCAT_BUILD_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs /code/app/.next

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["bun", "start"]
