# InShop CRM — API Config (NestJS API)

**NestJS REST API for feature flag management, RBAC, audit logging, and client bootstrap endpoints.**

This is the backend for [InShop CRM API Config Admin](https://github.com/inshop/inshop-crm-admin-next) — a self-hosted system to manage boolean feature flags per project and environment, control admin access through groups and roles, and expose read-only flag endpoints to client apps via scoped API tokens.

| | |
|---|---|
| **Admin dashboard** | [inshop-crm-admin-next](https://github.com/inshop/inshop-crm-admin-next) |
| **Stack** | NestJS 11 · TypeORM · PostgreSQL · JWT · Swagger |
| **Default URL** | [http://localhost:4000](http://localhost:4000) |
| **Swagger UI** | [http://localhost:4000/api](http://localhost:4000/api) |

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
- [Docker](#docker)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Run](#run)
- [Authentication](#authentication)
- [API overview](#api-overview)
- [Client feature flags (API token)](#client-feature-flags-api-token)
- [Admin API tokens](#admin-api-tokens)
- [Permissions and roles](#permissions-and-roles)
- [Audit log](#audit-log)
- [Dashboard UI](#dashboard-ui)
- [Architecture](#architecture)
- [Tests](#tests)

## Features

### Feature flags

- CRUD for flags with name, unique code, expiry date, and linked projects
- Per-environment enable/disable values (`PATCH /api/admin/feature-flags/:id/environments/:environmentId`)
- Client bootstrap endpoint returns all active flags for a project + environment
- Single-flag lookup by code
- A flag is **active** when linked to the project, enabled in that environment, and not expired

### Projects and environments

- Projects and environments each have name, code, and active status
- Project/environment **codes** are used in client API query params and API token scope

### Permissions (RBAC)

- **Users** — admin accounts with email/password, group membership, active flag
- **Groups** — named collections of module roles (create, update, list, details, delete)
- **Modules & roles** — auto-synced on startup; admin group receives all roles
- JWT auth with login, refresh, logout, and change-password endpoints

### API tokens

- Scoped to one project + one environment
- Prefix `ff_…`; plain value shown once on create or regenerate
- Used by client apps to read feature flags without admin JWT

### Audit log

- Records create, update, delete, login, and logout actions
- Stores JSON change diffs and metadata
- Filterable list for compliance and debugging

## Quick start

Clone both repositories as **sibling directories** (required for Docker full stack):

```
www/
  inshop-crm-api-nest/
  inshop-crm-admin-next/
```

### Option A — Docker (full stack)

```bash
git clone https://github.com/inshop/inshop-crm-api-nest.git
git clone https://github.com/inshop/inshop-crm-admin-next.git
cd inshop-crm-api-nest
cp .env.example .env          # set JWT_SECRET
cd ../inshop-crm-admin-next
cp .env.local.example .env.local
cd ../inshop-crm-api-nest
docker compose -f docker-compose.dev.yml up
```

- API: [http://localhost:4000](http://localhost:4000) · Swagger: [http://localhost:4000/api](http://localhost:4000/api)
- Admin: [http://localhost:3000](http://localhost:3000)

See [Docker](#docker) for prod setup, test database, and running from the admin repo.

### Option B — Local Node.js

```bash
git clone https://github.com/inshop/inshop-crm-api-nest.git
cd inshop-crm-api-nest
yarn install
cp .env.example .env          # set JWT_SECRET
docker compose -f docker-compose.dev.yml up db -d
yarn start:dev
```

Start the [admin dashboard](https://github.com/inshop/inshop-crm-admin-next#quick-start) in a second terminal.

Default admin (seeded on first startup):

| Email | Password |
|-------|----------|
| `admin@admin.admin` | `admin@admin.admin` |

Disable seeding with `SEED_ADMIN=false` in `.env`.

## Docker

Compose files run the **full stack** (PostgreSQL + API + admin dashboard). Configuration is read from `.env` (this repo) and `../inshop-crm-admin-next/.env.local`.

| File | Purpose |
|------|---------|
| `docker-compose.dev.yml` | Hot reload via `yarn start:dev` / `yarn dev` |
| `docker-compose.prod.yml` | Pre-built images from [GHCR](https://github.com/inshop?tab=packages) |
| `docker-compose.yml` | Local overrides (gitignored) |

### Development

From this repo (uses `.env` automatically):

```bash
cp .env.example .env          # set JWT_SECRET
cp ../inshop-crm-admin-next/.env.local.example ../inshop-crm-admin-next/.env.local

docker compose -f docker-compose.dev.yml up
docker compose -f docker-compose.dev.yml up -d   # detached
docker compose -f docker-compose.dev.yml down
```

Inside Docker, `DATABASE_HOST` is overridden to `db`; `BACKEND_BASE_URL` on the admin service points to `http://api:4000`.

### Production

Uses `ghcr.io/inshop/inshop-crm-api-nest` and `ghcr.io/inshop/inshop-crm-admin-next` images (built by [`.github/workflows/docker.yml`](.github/workflows/docker.yml)).

```bash
cp .env.example .env
# set JWT_SECRET, DATABASE_PASSWORD; DATABASE_SYNCHRONIZE=false for prod

docker compose -f docker-compose.prod.yml up -d
```

| Variable | Prod default | Description |
|----------|--------------|-------------|
| `API_IMAGE_TAG` | `latest` | API image tag |
| `ADMIN_IMAGE_TAG` | `latest` | Admin image tag |
| `DATABASE_SYNCHRONIZE` | `false` | Set `true` only for throwaway environments |
| `SEED_ADMIN` | `false` | Set `true` to seed default admin on first run |

Pull images manually:

```bash
docker pull ghcr.io/inshop/inshop-crm-api-nest:latest
docker pull ghcr.io/inshop/inshop-crm-admin-next:latest
```

### Test database

For integration and e2e tests:

```bash
docker compose -f docker-compose.dev.yml --profile test up db-test -d
```

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| `db` | 5432 | `api` | Development / Docker stack |
| `db-test` | 5433 | `api_test` | Integration and e2e tests |

### Run from the admin repo

The admin repo has the same compose files. When starting from there, pass the API `.env` for database variables:

```bash
cd ../inshop-crm-admin-next
cp .env.local.example .env.local
docker compose -f docker-compose.dev.yml --env-file ../inshop-crm-api-nest/.env up
```

## Prerequisites

- **Node.js** 22+
- **Yarn**
- **Docker** (for PostgreSQL and full stack via Compose)

## Installation

```bash
yarn install
cp .env.example .env
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | HTTP listen port |
| `JWT_SECRET` | — | **Required.** Secret for signing JWTs |
| `DATABASE_TYPE` | `postgres` | Database driver |
| `DATABASE_HOST` | `localhost` | Postgres host |
| `DATABASE_PORT` | `5432` | Postgres port |
| `DATABASE_NAME` | `api` | Database name |
| `DATABASE_USER` | `api` | Database user |
| `DATABASE_PASSWORD` | `api` | Database password |
| `DATABASE_SYNCHRONIZE` | `true` | TypeORM schema sync (dev only) |
| `DATABASE_TEST_NAME` | `api_test` | Test database name |
| `DATABASE_TEST_PORT` | `5433` | Test database port |
| `SEED_ADMIN` | `true` | Set to `false` to skip default admin user |
| `API_IMAGE_TAG` | `latest` | Docker prod API image tag |
| `ADMIN_IMAGE_TAG` | `latest` | Docker prod admin image tag |

`DATABASE_HOST` in `.env` is for local Node.js (`localhost`). Docker Compose overrides it to `db` inside the stack.

## Run

### Local Node.js

```bash
# Development (watch mode) — start db first, see Docker section
yarn start:dev

# Production build
yarn build
yarn start:prod
```

### Docker

See [Docker](#docker) for full-stack dev and prod commands.

- API: `http://localhost:4000` (or `PORT` from `.env`)
- OpenAPI JSON: `http://localhost:4000/api-json`
- Swagger UI: `http://localhost:4000/api`

## Authentication

| Audience | Header | How to obtain |
|----------|--------|---------------|
| Admin panel / CRUD | `Authorization: Bearer <JWT>` | `POST /api/admin/auth/login` or [dashboard sign-in](https://github.com/inshop/inshop-crm-admin-next#sign-in) |
| Client feature flags | `Authorization: Bearer <API token>` | Create under [Permissions → API Tokens](https://github.com/inshop/inshop-crm-admin-next#typical-workflow) or `POST /api/admin/api-tokens` |

### Auth endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/auth/login` | Email + password → JWT |
| `POST` | `/api/admin/auth/refresh` | Refresh JWT |
| `POST` | `/api/admin/auth/logout` | Invalidate session |
| `POST` | `/api/admin/auth/change-password` | Change password (authenticated) |

## API overview

All admin routes require JWT + role guards unless noted. Full request/response schemas: [Swagger UI](http://localhost:4000/api).

### Projects — `/api/admin/projects`

| Method | Path | Role |
|--------|------|------|
| `POST` | `/` | `ROLE_PROJECT_CREATE` |
| `GET` | `/` | `ROLE_PROJECT_LIST` |
| `GET` | `/:id` | `ROLE_PROJECT_DETAILS` |
| `PATCH` | `/:id` | `ROLE_PROJECT_UPDATE` |
| `DELETE` | `/:id` | `ROLE_PROJECT_DELETE` |

### Environments — `/api/admin/environments`

| Method | Path | Role |
|--------|------|------|
| `POST` | `/` | `ROLE_ENVIRONMENT_CREATE` |
| `GET` | `/` | `ROLE_ENVIRONMENT_LIST` |
| `GET` | `/:id` | `ROLE_ENVIRONMENT_DETAILS` |
| `PATCH` | `/:id` | `ROLE_ENVIRONMENT_UPDATE` |
| `DELETE` | `/:id` | `ROLE_ENVIRONMENT_DELETE` |

### Feature flags — `/api/admin/feature-flags`

| Method | Path | Role |
|--------|------|------|
| `POST` | `/` | `ROLE_FEATURE_FLAG_CREATE` |
| `GET` | `/` | `ROLE_FEATURE_FLAG_LIST` |
| `GET` | `/:id` | `ROLE_FEATURE_FLAG_DETAILS` |
| `PATCH` | `/:id` | `ROLE_FEATURE_FLAG_UPDATE` |
| `PATCH` | `/:id/environments/:environmentId` | `ROLE_FEATURE_FLAG_UPDATE` |
| `DELETE` | `/:id` | `ROLE_FEATURE_FLAG_DELETE` |

Manage flags in the [dashboard Feature Flags section](https://github.com/inshop/inshop-crm-admin-next#feature-flags).

### Users — `/api/admin/users`

| Method | Path | Role |
|--------|------|------|
| `POST` | `/` | `ROLE_USER_CREATE` |
| `GET` | `/` | `ROLE_USER_LIST` |
| `GET` | `/:id` | `ROLE_USER_DETAILS` |
| `PATCH` | `/:id` | `ROLE_USER_UPDATE` |
| `DELETE` | `/:id` | `ROLE_USER_DELETE` |

### Groups — `/api/admin/groups`

| Method | Path | Role |
|--------|------|------|
| `POST` | `/` | `ROLE_GROUP_CREATE` |
| `GET` | `/` | `ROLE_GROUP_LIST` |
| `GET` | `/:id` | `ROLE_GROUP_DETAILS` |
| `PATCH` | `/:id` | `ROLE_GROUP_UPDATE` |
| `DELETE` | `/:id` | `ROLE_GROUP_DELETE` |

### Modules and roles — `/api/admin/modules`

| Method | Path | Role |
|--------|------|------|
| `GET` | `/` | Authenticated |
| `GET` | `/:moduleId/roles` | Authenticated |

Modules: `users`, `groups`, `projects`, `environments`, `featureFlags`, `audit`, `apiTokens`.

## Client feature flags (API token)

For application runtimes — not the admin panel. Query params `project` and `environment` are **required** and must match the API token's project/environment **codes**.

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/api/feature-flags/bootstrap` | `{ "feature_flags": { "<code>": true } }` |
| `GET` | `/api/feature-flags/:code` | `{ "enabled": true \| false }` — `404` if code does not exist |

**Examples** (replace `my-app`, `staging`, and the token):

```bash
# Bootstrap all active flags
curl -s "http://localhost:4000/api/feature-flags/bootstrap?project=my-app&environment=staging" \
  -H "Authorization: Bearer ff_your_api_token"

# Single flag by code
curl -s "http://localhost:4000/api/feature-flags/checkout?project=my-app&environment=staging" \
  -H "Authorization: Bearer ff_your_api_token"
```

Create tokens in the [dashboard](https://github.com/inshop/inshop-crm-admin-next#api-tokens) — it shows copy-ready `curl` samples with your project and environment codes.

## Admin API tokens

Manage via [dashboard → Permissions → API Tokens](https://github.com/inshop/inshop-crm-admin-next#api-tokens) or REST:

| Method | Path | Role |
|--------|------|------|
| `POST` | `/api/admin/api-tokens` | `ROLE_API_TOKEN_CREATE` — returns `plainToken` once |
| `GET` | `/api/admin/api-tokens` | `ROLE_API_TOKEN_LIST` |
| `POST` | `/api/admin/api-tokens/:id/regenerate` | `ROLE_API_TOKEN_UPDATE` — new `plainToken` |
| `GET` | `/api/admin/api-tokens/:id` | `ROLE_API_TOKEN_DETAILS` |
| `PATCH` | `/api/admin/api-tokens/:id` | `ROLE_API_TOKEN_UPDATE` |
| `DELETE` | `/api/admin/api-tokens/:id` | `ROLE_API_TOKEN_DELETE` |

Create/update body: `{ "name", "projectId", "environmentId", "isActive" }`.

**Example — login and create a token:**

```bash
# 1. Admin JWT
curl -s -X POST http://localhost:4000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.admin","password":"admin@admin.admin"}'

# 2. Create API token (use JWT from step 1)
curl -s -X POST http://localhost:4000/api/admin/api-tokens \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local dev","projectId":1,"environmentId":1,"isActive":true}'
```

## Permissions and roles

On startup, `RolesSyncService` creates modules, roles, an `admin` group with all roles, and the default admin user.

Each module exposes five roles where applicable:

| Module | Roles |
|--------|-------|
| Users | `ROLE_USER_*` |
| Groups | `ROLE_GROUP_*` |
| Projects | `ROLE_PROJECT_*` |
| Environments | `ROLE_ENVIRONMENT_*` |
| Feature flags | `ROLE_FEATURE_FLAG_*` |
| Audit | `ROLE_AUDIT_LIST`, `ROLE_AUDIT_DETAILS` |
| API tokens | `ROLE_API_TOKEN_*` |

Assign roles to groups in the [dashboard Groups section](https://github.com/inshop/inshop-crm-admin-next#groups).

## Audit log

| Method | Path | Role |
|--------|------|------|
| `GET` | `/api/admin/audits` | `ROLE_AUDIT_LIST` |
| `GET` | `/api/admin/audits/:id` | `ROLE_AUDIT_DETAILS` |

Tracked actions: `create`, `update`, `delete`, `login`, `logout`.

Entity types: `user`, `group`, `project`, `environment`, `feature_flag`, `api_token`, `auth`.

View the global log in the [dashboard Audit Log](https://github.com/inshop/inshop-crm-admin-next#audit-log) or per-entity history on feature flag details.

## Dashboard UI

The [admin dashboard](https://github.com/inshop/inshop-crm-admin-next) provides:

- Feature flag grid with environment toggles and filters
- CRUD dialogs for all resources
- API token management with `curl` examples
- Audit history with change diffs

[Screenshots](https://github.com/inshop/inshop-crm-admin-next#screenshots) · [Quick start](https://github.com/inshop/inshop-crm-admin-next#quick-start)

## Architecture

```
Client apps ──GET /api/feature-flags/*──► NestJS API ◄──JWT── Admin dashboard (Next.js)
                                              │
                                         PostgreSQL
```

- Global prefix: `/api`
- TypeORM entities with PostgreSQL (`jsonb` for audit changes)
- `class-validator` + custom `IsUnique` / `Exists` decorators
- Helmet security headers
- Scheduled job: expired user token cleanup (daily at midnight)

## Tests

Config loaded from [`.env.test`](.env.test) via [`test/setup.ts`](test/setup.ts). Integration and e2e tests use `db-test` on `localhost:5433`.

```bash
docker compose -f docker-compose.dev.yml --profile test up db-test -d

# Unit tests (no database)
yarn test:unit

# Integration tests (real Postgres)
yarn test:integration

# E2E smoke tests (HTTP + Postgres)
yarn test:e2e

# All of the above
yarn test:all

# Coverage (unit tests only)
yarn test:cov
```

CI runs the same suite with a Postgres service — see [`.github/workflows/test.yml`](.github/workflows/test.yml).

For frontend tests, see [dashboard testing](https://github.com/inshop/inshop-crm-admin-next#testing).
