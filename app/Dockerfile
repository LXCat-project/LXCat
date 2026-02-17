# SPDX-FileCopyrightText: LXCat team
# SPDX-License-Identifier: AGPL-3.0-or-later

# Install dependencies only when needed
FROM oven/bun:1-alpine AS base

# Use a multi-stage build to keep the release image small
FROM base AS build

RUN apk add --no-cache libc6-compat curl build-base

# Install rust
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /build
COPY . .

# TODO: This command currently "fails" with exit code 1 even though packages
#       install successfully. The `|| :` statement swallows the exit code.
#       Remove once this is no longer a problem.
RUN bun install --frozen-lockfile || :

# Uncomment the following line to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Build a standalone application
ENV NEXT_PRIVATE_STANDALONE=true

# Set production environment
ENV NODE_ENV=production
ENV LXCAT_BUILD_ENV=production

RUN bun run build --no-cache

# Production image, copy all the files and run next
FROM base AS release

# Uncomment the following line to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1
 
COPY --from=build /build/app/.next/standalone .
COPY --from=build /build/app/.next/static ./app/.next/static
COPY --from=build /build/app/public ./app/public

EXPOSE 3000

ENV PORT=3000

CMD ["bun", "app/server.js"]
