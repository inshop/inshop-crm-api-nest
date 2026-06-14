# Inshop CRM API

NestJS backend for the Inshop CRM admin panel.

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
