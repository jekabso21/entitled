# Entitled

Entitled is a self-hosted, white-label portal where hardware vendors give their clients one login for everything after the sale: firmware releases, versioned documentation, changelogs and support. Access is driven by **entitlements** (which client account may see which product and hardware revisions), so it works for devices that never connect to the internet.

- **Clients** see only the products they are entitled to, download checksummed firmware, read the docs and open support requests.
- **Vendors** manage products, releases, docs and client accounts in a dashboard, and publish releases from GitLab CI with scoped API keys.

The product scope and roadmap are in [`docs/project-plan.md`](docs/project-plan.md).

## Run it with Docker

Requirements: Docker with Compose v2.

```sh
cp deploy/.env.example deploy/.env
# Edit deploy/.env: set BETTER_AUTH_SECRET (openssl rand -base64 32),
# POSTGRES_PASSWORD and S3_SECRET_ACCESS_KEY to long random values.
docker compose -f deploy/compose.yaml up -d --build
```

The portal is then at <http://localhost:8080>. On every start the one-shot `init` service applies database migrations and prepares the storage bucket, so upgrades need no manual steps.

Create the first vendor admin:

```sh
docker compose -f deploy/compose.yaml run --rm -e ADMIN_PASSWORD='choose-a-long-password' \
  api node apps/api/src/scripts/create-vendor-admin.ts --email you@vendor.com --name "Your Name"
```

Everyone else joins by invitation: vendor admins invite staff and client users, and client admins invite their own colleagues.

### Try it with demo data

Set `SEED_DEMO=true` in `deploy/.env` before the first start to create a demo vendor admin (`admin@entitled.local`), a client admin (`client@acme.local`), a product with a published release and a documentation page. Both demo users use `DEMO_PASSWORD` (default `entitled-demo-pass`). The bundled Mailpit inbox at <http://localhost:8026> shows every email the portal sends. Never enable demo data on a real install.

## Going to production

| Setting (`deploy/.env`)                       | What to set                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_ADDRESS`                                | Your portal domain, e.g. `portal.example.com`. Caddy obtains HTTPS certificates automatically.                                                                                                            |
| `PUBLIC_URL`                                  | `https://portal.example.com`                                                                                                                                                                              |
| `STORAGE_SITE_ADDRESS` / `STORAGE_PUBLIC_URL` | A second domain for file downloads and uploads, e.g. `files.portal.example.com` / `https://files.portal.example.com`. Browsers and CI talk to storage directly so large files never pass through the API. |
| `SMTP_URL`, `MAIL_FROM`                       | Your mail server, e.g. `smtps://user:pass@smtp.example.com:465`. Remove the `mailpit` service from `compose.yaml` once real mail works.                                                                   |

Point both domains at the server, open ports 80 and 443, and set `HTTP_PORT=80` and `HTTPS_PORT=443`. Caddy serves both domains on those ports.

Branding (portal name, colour, logo) is configured in the dashboard under **Settings**, not in the environment.

### Backups

All state lives in two Docker volumes: Postgres (`postgres_data`) and object storage (`storage_data`). Back up both. A consistent database dump:

```sh
docker compose -f deploy/compose.yaml exec -T postgres \
  pg_dump -U entitled -d entitled --format=custom > entitled-$(date +%F).dump
```

### Upgrading

```sh
git pull
docker compose -f deploy/compose.yaml up -d --build
```

## Publishing releases from GitLab CI

In the dashboard, open **API keys**, create a key and store it as a masked CI/CD variable named `ENTITLED_API_KEY`. The page shows a ready-made `.gitlab-ci.yml` job. Tag pipelines then create the release, upload the files, wait until the portal has verified every SHA-256 checksum and optionally publish. Whether new releases land as drafts or go live immediately is set under **Settings**.

## Development

The stack is TypeScript end to end: Nuxt 4 and Nuxt UI for the web app, Hono with an OpenAPI contract for the API, PostgreSQL with Drizzle, pg-boss for background jobs and S3-compatible storage (RustFS locally).

```sh
cp .env.example .env              # set BETTER_AUTH_SECRET
docker compose up -d              # postgres, rustfs, mailpit
pnpm install
pnpm --filter @entitled/db db:migrate
pnpm --filter @entitled/api storage:init
pnpm --filter @entitled/api seed:demo
pnpm dev                          # web :3000, api :3001, worker
```

`pnpm check` runs linting, type checks, unit and integration tests and the format check; `pnpm test:e2e` runs the Playwright suite against a running stack. The API serves its OpenAPI document at `/api/openapi.json`.

Coding standards, project structure and the rules every change must follow are in [`AGENTS.md`](AGENTS.md).
