# SPDX-FileCopyrightText: LXCat team

# SPDX-License-Identifier: AGPL-3.0-or-later
FROM node:22-alpine

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git
RUN corepack enable

WORKDIR /code
COPY . .

RUN pnpm install --frozen-lockfile

ENV LXCAT_BUILD_ENV production

# Build database and skip app workspace build
RUN pnpm -C packages/schema build
RUN pnpm -C packages/database build

WORKDIR /code/packages/database

ENTRYPOINT ["pnpm", "run"]
