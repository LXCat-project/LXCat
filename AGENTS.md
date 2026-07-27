# LXCat Agent Guide

## Repo Overview

- **Next.js 14+ monorepo** with Turborepo (`turbo.json` for dev)
- **Packages**: `app/` (React/Next.js), `packages/schema/`, `packages/database/`, `packages/converter/` (Rust)
- **Build tool**: Bun (`packageManager`: "bun@1.3.5")
- **Database**: ArangoDB (document DB with JSON schema validation)
- **UI**: Mantine, React, Next.js App Router
- **Auth**: next-auth + OpenID providers (Orcid, Keycloak, Auth0, GitLab)

## Getting Started

```bash
cd /home/daan/git/lxcat
bun install
bun dev  # Starts app + database + schema workspaces
```

Run `npm run lint`, `npm run typecheck`, then tests before committing.

## Build Order Matters

When building or CI runs, packages must be built in order:

```bash
(cd packages/schema && bun run build)
(cd packages/database && bun run build)
(cd packages/converter && bun run build)
(cd app && bun run build --webpack)
```

## Running Tests

Each package has its own test command - run from the workspace root or the specific directory. Use `turbo run test` for all at once.

### App (Next.js unit tests):
```bash
bun test --coverage --coverage-reporter=lcov
```

- End-to-end: `bun test:e2e` (spins up dev server + ArangoDB container)
- E2E requires Playwright Chromium installed: `npx playwright install chromium`

### Database:
```bash
cd packages/database && bun test --coverage --coverage-reporter=lcov
```

- Testcontainers provides an isolated DB for tests
- Seeding: `bun seed <path>` or `bun drop-database && bun reload` (⚠️ destructive)

### Convertor (Rust):
```bash
cd packages/converter && cargo llvm-cov report -r --codecov --output-path codecov.json
```

- Requires Rust toolchain + `cargo-llvm-cov` installed

## Database Setup & Seeding

1. Run `bun setup` to create database, user, and collections from JSON schemas
2. Seed with test data: `bun seed seeds/test` or `bun load-css <dir>`
3. Make a user admin: `bun make-admin <email>`
4. Rebuild app package: `cd packages/database && bun run build`

The `src/db/index.ts` exports the ArangoDB client; imports as:
```ts
import { db } from "../../packages/database/src/db";
```

Schema imports from `app/src/...`.

## OpenAPI & Zod

Every API route should have:

- A corresponding `openapi.ts` file in the same directory
- Use global `OpenApiRegistry.register()` to register paths + `zod-to-openapi` schemas

When you add a route, create its openapi entry. When reusing existing zod schemas, manually add them via `register()` in `app/api/schemas.openapi.ts` to avoid duplication in the spec.

## Environment & Auth

Configuration lives in `.env.development` or `.env.production` (root):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_URL` | Root URL for absolute URLs |
| `NEXTAUTH_SECRET` | Required |
| `ARANGO_URL/DB/USER/PASSWORD` | Database connection |
| `AUTH0_* / ORCID_* / KEYCLOAK_* / GITLAB_*` | One IDP required (see `/app/docs/setup-auth.md`) |

E2E tests use a test OIDC server; app configuration uses `TESTOIDC_CLIENT_*` env vars.

## Production Deployment

Use Docker Compose from the root:

```bash
docker-compose up --build
docker compose run setup setup
docker compose run setup seed seeds/test              # for testing
```

For production seeding, bind a read-only volume containing cross-section-set JSONs to `/data`, then run `docker compose -f docker-compose.yml setup load-css /data`.

## CI Pipeline

The `.github/workflows/test.yml` job builds all packages + runs linting and tests. Notably:

- **Lint is disabled** (`# TODO: Switch back to turborepo build once we do not have to rely on webpack for coverage reporting`). When you enable it, ensure your code passes before committing
- Runs Playwright test setup: `bun run playwright install chromium --with-deps` before unit + E2E tests

## Code Standards

- License header via REUSE (`.reuse/dep5`) - add missing headers with `bun annotate`
- Documentation in `/docs` uses GitHub-flavored Markdown + Mermaid diagrams
- No `.md` extension on internal links when docs are hosted on the site

## Common Pitfalls

1. **Missing env vars** – ensure `.env.development` has at least one IDP configured (Orcid sandbox for dev is easiest)
2. **Wrong build order** – always build packages/schema/database/converter before app
3. **E2E test ports** – ensure ports 8001, 8002, and 8003 are free
4. **Schema reuse** – when reusing a Zod schema in multiple routes, add it manually to `register()` in `openapi.ts` files
