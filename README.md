# API Config API

NestJS backend for the API Config admin panel.

## Prerequisites

- Node.js 22+
- Yarn
- Docker (for PostgreSQL)

## Setup

```bash
yarn install
cp .env.example .env
```

Fill in `JWT_SECRET` in `.env`, then start PostgreSQL:

```bash
docker compose up -d
```

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| `db` | 5432 | `api` | Development |
| `db-test` | 5433 | `api_test` | Integration and e2e tests |

Start the test database when running integration or e2e tests:

```bash
docker compose up -d db-test
```

## Run

```bash
yarn start:dev
```

API runs at `http://localhost:4000` (see `PORT` in `.env`). Swagger UI: `http://localhost:4000/api`.

Default admin user (seeded on startup): `admin@admin.admin` / `admin@admin.admin`

## API endpoints

### Authentication

| Audience | Header | Notes |
|----------|--------|-------|
| Admin panel / CRUD | `Authorization: Bearer <JWT>` | Login via `POST /api/admin/auth/login` |
| Client feature flags | `Authorization: Bearer <API token>` | Token from admin **API Tokens** (`ff_…`); scoped to one project + environment |

### Client feature flags (API token)

Query params `project` and `environment` are **required** and must be the project/environment **codes**. They must match the API token scope.

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/api/feature-flags/bootstrap` | `{ "feature_flags": { "<code>": true } }` — all active flags for project + environment |
| `GET` | `/api/feature-flags/:code` | `{ "enabled": true \| false }` — `404` if code does not exist |

A flag is **active** when it is linked to the project, enabled for that environment, and not expired.

**Examples** (replace `my-app`, `staging`, and the token):

```bash
# Bootstrap all active flags
curl -s "http://localhost:4000/api/feature-flags/bootstrap?project=my-app&environment=staging" \
  -H "Authorization: Bearer ff_your_api_token"

# Single flag by code
curl -s "http://localhost:4000/api/feature-flags/checkout?project=my-app&environment=staging" \
  -H "Authorization: Bearer ff_your_api_token"
```

### Admin API tokens

Manage tokens in the admin panel under **Permissions → API Tokens**, or via:

| Method | Path | Role |
|--------|------|------|
| `POST` | `/api/admin/api-tokens` | `ROLE_API_TOKEN_CREATE` — returns `plainToken` once |
| `GET` | `/api/admin/api-tokens` | `ROLE_API_TOKEN_LIST` |
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

Other admin resources (users, groups, projects, environments, feature flags, audit) are under `/api/admin/*` with JWT + role guards. See Swagger at `http://localhost:4000/api`.

## Tests

Test config is loaded from [`.env.test`](.env.test) via [`test/setup.ts`](test/setup.ts). Integration and e2e tests connect to the `db-test` service on `localhost:5433`.

```bash
docker compose up -d db-test

# Unit tests (no database)
yarn test:unit

# Integration tests (real Postgres, test DB)
yarn test:integration

# E2E smoke tests (HTTP + Postgres)
yarn test:e2e

# All of the above
yarn test:all

# Coverage (unit tests only)
yarn test:cov
```

CI runs the same suite with a Postgres service; see [`.github/workflows/test.yml`](.github/workflows/test.yml).
