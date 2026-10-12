# AGENTS.md

Entitled is a self-hosted, white-labelable after-sales portal for hardware vendors: firmware releases, versioned docs, changelogs and support behind one login. Access is driven by **entitlements** (client account → product, optionally revisions/channels), not by connected devices. Full scope and phasing: `docs/project-plan.md`. Read it before starting any feature.

Rules here apply to every package. A closer `AGENTS.md` inside an app or package overrides these rules for its subtree.

## Commands

Run from the repo root. All of them must pass before work is considered done.

```sh
cp .env.example .env         # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose up -d         # postgres 18, rustfs (S3, console :9001), mailpit (UI :8025)
pnpm install                 # pnpm 12, Node 26 (see .nvmrc / packageManager)
pnpm --filter @entitled/db db:migrate        # apply migrations
pnpm --filter @entitled/api storage:init     # create the artifacts bucket
pnpm dev                     # turbo: web :3000, api :3001, worker
pnpm check                   # lint + check-types + test + prettier --check
pnpm format                  # prettier --write
pnpm --filter @entitled/db db:generate --name <change>   # SQL migration from schema changes
pnpm --filter @entitled/api auth:generate    # regenerate Better Auth tables after auth config changes
pnpm --filter @entitled/api seed:demo        # admin@entitled.local + client@acme.local (DEMO_PASSWORD)
pnpm --filter @entitled/api vendor:create-admin --email <e> --name <n>   # first admin on a real install
pnpm test:e2e                # Playwright against a running stack (E2E_BASE_URL, MAILPIT_URL)
pnpm docker:up               # full stack in Docker behind Caddy: http://localhost:8080, mail :8026
```

The Docker stack reads `deploy/.env` (copy `deploy/.env.example`). Its `init` service runs migrations, creates the bucket and seeds demo data when `SEED_DEMO=true`.

Scope to one package with `pnpm --filter <name> <script>`. Never run `drizzle-kit push` against anything except a throwaway local database.

## Stack and pinned versions

Versions were checked against the npm registry on 2026-10-22. Shared versions live in the pnpm **catalog** (`pnpm-workspace.yaml`). Packages reference them as `"catalog:"`, never as a raw range.

pnpm refuses versions published less than 24 hours ago (`minimumReleaseAge`) and blocks trust downgrades (`trustPolicy`). If an install fails on a fresh release, lower the catalog range floor so a mature version resolves. Don't disable the policy. Exclusions go in `pnpm-workspace.yaml` with a one-line reason.

| Area            | Choice                                                                                            | Version notes                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Runtime         | Node.js                                                                                           | 26.x (Active LTS from 2026-10-28). `engines: ">=24.15"`                                             |
| Language        | TypeScript                                                                                        | **pin `~6.0`**. TS 7 (Go) breaks typescript-eslint and vue-tsc today; revisit when 7.1 ships an API |
| Monorepo        | pnpm 12 workspaces + Turborepo 2.11                                                               | `catalog:`, `workspace:*`                                                                           |
| Web             | Nuxt 4.6, Nuxt UI 4.12, Vue 3.5, Tailwind 4.3                                                     | Pinia 4 only for complex stores                                                                     |
| Docs editor     | Nuxt UI `UEditor` (TipTap 3), `content-type="markdown"`                                           |                                                                                                     |
| Markdown render | unified + remark-gfm + rehype-sanitize + @shikijs/rehype 4 + mermaid (client side)                |                                                                                                     |
| API             | Hono 4.13 + `@hono/node-server` 2 + `@hono/zod-openapi` 1.6                                       | stay on 4.x until v5 is stable                                                                      |
| Validation      | Zod 4.6, imported from `"zod"` (or `@hono/zod-openapi` in API route files)                        |                                                                                                     |
| Database        | PostgreSQL 18 + Drizzle ORM **1.0.0-rc.4** (pinned)                                               | relations v2, `drizzle-orm/zod`                                                                     |
| Auth            | Better Auth 1.7 + `@better-auth/drizzle-adapter`, organization, twoFactor, `@better-auth/api-key` | CLI is `npx auth`                                                                                   |
| Jobs            | pg-boss 12                                                                                        |                                                                                                     |
| Storage         | `@aws-sdk/client-s3` v3 + `s3-request-presigner` + `lib-storage`                                  | RustFS locally; `forcePathStyle: true`                                                              |
| Email           | Nodemailer 10 over SMTP; Mailpit locally                                                          |                                                                                                     |
| Tests           | Vitest 5, `@nuxt/test-utils` 4, Playwright 1.64                                                   |                                                                                                     |
| Lint/format     | ESLint 10 flat config, typescript-eslint 8 `strictTypeChecked`, `@nuxt/eslint`, Prettier 3        |                                                                                                     |
| Deploy          | Docker Compose + Caddy 2.11                                                                       |                                                                                                     |

Don't add a dependency when the platform or an existing dependency already does the job. Every new dependency must be in the catalog and justified in the PR.

## Repository layout

```
apps/
  web/              Nuxt 4 portal: client side + vendor admin
  api/              Hono REST API; the OpenAPI contract is generated from it
  worker/           pg-boss consumers: email, webhooks, rollout promotion
  cli/              release CLI for CI (phase 2)
packages/
  contracts/        Zod schemas + inferred types shared by api, web, cli
  db/               Drizzle schema, relations, migrations, client factory, migration runner
  jobs/             pg-boss queue names, payload schemas, queue registration, transactional enqueue
  markdown/         remark/rehype pipeline shared by web render and api export
  config-typescript/  tsconfig bases (base, node)
  config-eslint/      shared flat-config pieces
deploy/             Dockerfile (targets: server, web), compose.yaml, Caddyfile, .env.example
docs/               project plan, ADRs (docs/adr/NNNN-title.md)
```

- Package names use the `@entitled/` scope, e.g. `@entitled/contracts`.
- Dependencies point one way: `apps → packages`, and `contracts` depends on nothing internal. `web` never imports `db`, `api` or `worker` code. Shared logic moves into a package.
- Internal packages are **just-in-time**: `exports` point at `./src/*.ts` and there is no build step. Expose deliberate subpaths (`"./releases": "./src/releases/index.ts"`) rather than one catch-all root.
- No TypeScript `paths` aliases across packages. Use package imports. Inside a Node package, use `#` subpath imports (`"imports": { "#*": "./src/*" }`).

### apps/api: feature folders, one use case per file

```
apps/api/src/
  main.ts                     starts @hono/node-server
  app.ts                      builds OpenAPIHono, mounts middleware + feature routers
  config/env.ts               Zod-parsed env, the only reader of process.env
  middleware/                 session.ts, require-role.ts, request-id.ts …
  lib/                        cross-feature infrastructure: s3-client.ts, mailer.ts, http-error.ts
  features/
    releases/
      releases.router.ts      composes this feature's routes, nothing else
      create-release.route.ts createRoute() definition + handler for one endpoint
      publish-release.route.ts
      create-release.ts       use case: business rules, called by the route
      publish-release.ts
      release-queries.ts      Drizzle reads for this feature
      release-access.ts       entitlement filtering for releases
    entitlements/ …
    docs/ …
    support/ …
  test/                       mirrors features/
```

- **Route files** parse input, call one use case and shape the response. They contain no business logic and no SQL.
- **Use case files** export one function (`createRelease(deps, input)`). They take their dependencies (db/tx, storage, queue) as arguments, which keeps them unit-testable without HTTP.
- A **feature never imports another feature's internals.** When two features need the same thing, move it to `lib/` or a package.

### apps/web: Nuxt 4 conventions

```
apps/web/
  app/
    pages/            file routes; (client)/ and (vendor)/ route groups
    layouts/          default.vue, dashboard.vue (UDashboardGroup)
    components/       PascalCase.vue, grouped by feature: release/ReleaseCard.vue
    composables/      useX: one composable per file
    middleware/       route guards (auth, role)
    utils/            pure helpers, auto-imported
    app.config.ts     ui.colors, branding defaults
    assets/css/main.css   @import "tailwindcss"; @import "@nuxt/ui"; @theme tokens
  server/             only BFF glue when unavoidable; real API lives in apps/api
  shared/             code used by both app/ and server/ (no Vue, no Nitro imports)
```

- Nuxt builds component names from the folder path (`components/release/Card.vue` becomes `<ReleaseCard>`). Name the file after the full tag: `components/release/ReleaseCard.vue`.
- Never edit the generated root `tsconfig.json`. Tune TypeScript through `typescript.tsConfig` in `nuxt.config.ts`.

## Coding standards

### Files and responsibility

- **One responsibility per file.** A file has one reason to change and exports one primary unit: one component, one composable, one use case, one route, one schema group. Small private helpers may live beside it. If a helper gets a second caller, it gets its own file.
- **Size limits:** aim under 200 lines and treat 300 as a hard stop that means "split it". Functions should fit on a screen (about 40 lines). Nest at most 3 levels and use early returns.
- **File names are `kebab-case.ts`.** The exceptions are Vue components (`PascalCase.vue`) and Nuxt route files (`[id].vue`, `index.vue`). Name a file after what it exports: `publish-release.ts` exports `publishRelease`.
- **Named exports only.** Default exports are allowed only where a framework requires them: Nuxt pages, layouts and plugins, `nuxt.config.ts`, `app.config.ts`, `*.config.ts`, `eslint.config.mjs`.
- **No barrel files** (`index.ts` that re-exports) inside apps. In packages, a barrel may exist only as an `exports` subpath entry. The one other exception is `packages/db/src/schema/index.ts`, which Drizzle needs.
- **Tests sit next to what they test** as `*.test.ts`. Cross-cutting e2e tests go in `apps/web/test/e2e/`.

### TypeScript

- The base tsconfig enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly`, `moduleDetection: "force"`, `skipLibCheck` and `types: ["node"]` (Node packages). The Nuxt app sets the same flags in `nuxt.config.ts` except `exactOptionalPropertyTypes`, which conflicts with how Vue templates pass unset props.
- Node packages (`api`, `worker`, `cli`, `db`, `contracts`) use `"module": "nodenext"` and run with Node's native type stripping. Relative imports therefore need the `.ts` extension, and type-only imports must use `import type`.
- `erasableSyntaxOnly` rules out **enums, namespaces, parameter properties and decorators**. Use `as const` objects or string-literal unions for enumerated values:
  ```ts
  export const releaseStatuses = ['draft', 'published', 'archived'] as const
  export type ReleaseStatus = (typeof releaseStatuses)[number]
  ```
- **No `any`.** Use `unknown` and narrow it, ideally with a Zod parse at the boundary. Don't use non-null assertions (`!`) or `as` casts. Write a type guard instead, or fix the type at its source.
- Use `type` for data shapes and unions. Use `interface` only when you need declaration merging.
- Derive types instead of writing them twice: `z.infer<typeof schema>`, `typeof table.$inferSelect`, `ReturnType<…>`. Use `satisfies` for config and lookup objects.
- Prefer `readonly` arrays and properties for data passed between layers. Don't mutate arguments.
- Async code always awaits or explicitly returns its promises (`no-floating-promises`). Pass `AbortSignal`s through to long-running work.

### Naming

- Variables and functions are `camelCase`, types and components `PascalCase`. Use `SCREAMING_SNAKE` only for true compile-time constants.
- Booleans read as questions: `isPublished`, `hasEntitlement`, `canDownload`. Functions start with a verb: `findEntitledProducts`, `buildChangelog`.
- Use the domain words from the project plan exactly: tenant, client account, product, hardware revision, entitlement, release, artifact, channel, doc space, support thread. Don't invent synonyms such as "package", "build" or "device" for a release, an artifact or a product.
- Abbreviate only when the abbreviation is universal (`id`, `url`, `db`, `tx`).

### Comments: only where they earn their place

The code says _what_; a comment says _why_. Default to none.

- **Write a comment** for non-obvious business rules ("rev A units lack the bootloader needed for 3.x"), deliberate trade-offs, workarounds (link the issue or upstream bug), security-sensitive reasoning, and anything a careful reader would otherwise "fix" and break.
- **Don't write** comments that restate code, label sections (`// --- helpers ---`), keep dead code commented out, track changes ("added by…", "fixed bug"), or mark TODOs without an issue link.
- Before writing a comment, see whether a better name or an extracted function makes it unnecessary.
- JSDoc goes only on exported APIs of `packages/*` where the signature alone doesn't explain the behaviour. Keep it short and skip `@param` lines that just repeat the type.
- Every `eslint-disable` or `@ts-expect-error` carries a one-line reason.

### Errors and validation

- **Validate at every boundary with Zod:** HTTP input, env vars, job payloads, webhook bodies, CSV imports and file metadata. Once data is past the boundary, trust the types.
- Shared request and response schemas live in `@entitled/contracts`. Route files in `api` attach `.openapi()` metadata. `web` forms pass the same schemas to `UForm :schema`.
- Use Zod 4 idioms: the `error:` param (not `message`), `z.email()`, `z.uuid()`, `z.iso.datetime()`, `z.strictObject()` for request bodies, and `.extend()` instead of `.merge()`.
- Expected failures (not entitled, version conflict, not found) are part of the use case's return type, or a typed `DomainError` that `app.onError` maps to a status code. Reserve `throw` for real bugs and infrastructure failures.
- The API returns one error shape everywhere: `{ error: { code, message, details? } }`. A validation failure is a 422 from the `defaultHook` of `OpenAPIHono`.
- Never swallow errors. Log once at the boundary, with the request id, and never log secrets, tokens, presigned URLs or personal data.

### Backend specifics

- **Hono:**
  - Define every endpoint with `createRoute` + `app.openapi(...)` so the OpenAPI document stays complete. Serve it at `/openapi.json` (`doc31`).
  - Write handlers inline in the route file, not in controller classes.
  - Apply `secureHeaders`, `bodyLimit`, `requestId` and a strict CORS allowlist globally.
  - Errors inside `streamSSE` never reach `onError`. Handle them in the stream callback, and stop on `stream.aborted`.
  - Never give a route a path parameter where a sibling route has a literal segment (`/releases/{id}/{action}` swallowed `/releases/{id}/artifacts`). Spell out each action as its own route.
- **Drizzle:**
  - Schema is one file per domain in `packages/db/src/schema/`. Define tables with `snakeCase.table(...)` from `drizzle-orm/pg-core` and leave column names out (`text()`, not `text('name')`). Drizzle 1.0 dropped the `casing` option from `drizzle()`.
  - Primary keys are `uuid` (v7) unless a table has a reason to differ. Every table has `createdAt`/`updatedAt` with timezone.
  - Better Auth tables lack some constraints we rely on (e.g. unique membership). Add them in a custom migration (`db:generate --custom --name <name>`), never in the generated schema.
  - Write relations with `defineRelations`, and build validation schemas with `drizzle-orm/zod` (`createInsertSchema` …), never hand-copied.
  - **Migrations:** run `db:generate`, review the SQL, commit it, then `db:migrate`. Never edit a migration that has already been applied; add a new one instead.
  - Multi-write use cases take a `TransactionScope` (`{ tx, enqueue }`) from `withTransaction` in `apps/api/src/lib/transaction.ts`. Jobs go through `enqueue`, which inserts them on the same transaction (pg-boss `fromDrizzle`) so a rollback drops them too. Read-only helpers take `Queryable` so they work with or without a transaction.
- **Better Auth:**
  - The single `auth` instance lives in `apps/api/src/lib/auth.ts` and is mounted at `/api/auth/*` after CORS.
  - Generate its tables with `pnpm --filter @entitled/api auth:generate`, which writes `packages/db/src/schema/auth.ts`, then run the normal Drizzle migration flow. Never hand-edit that file; it is excluded from lint and Prettier.
  - Client accounts are Better Auth organizations (`members.role`: `admin` = client admin, `member` = client user). Vendor staff have `users.vendorRole` (`admin` | `editor` | `support`) and no membership.
  - Self sign-up is disabled. Users are created only by accepting an invitation (`features/invitations`) or by the `vendor:create-admin` script, both through `createCredentialUser`.
  - Routes authorize with `requireActor` / `requireVendorRole` from `lib/actor.ts`. Checks that depend on the target object (e.g. client admin of _this_ account) live in the use case, before any data about that object is read.
- **CI tokens:**
  - Issue them with `@better-auth/api-key`: hashed at rest, prefixed (`ent_`), scoped, with an expiry, and shown only once.
  - They authenticate only the release API scopes they carry. Never accept them for user sessions.
  - The session middleware accepts `Authorization: Bearer ent_…` or `x-api-key`. A key acts as its owner (`Actor.apiKeyId` set) and stops working when the owner is no longer vendor admin or editor.
  - Routes opt in with `requireActor(c, { allowApiKey: true })` / `requireVendorRole(c, roles, { allowApiKey: true })`. Every other route rejects keys with 403, so key management, accounts and entitlements stay session-only.
  - Audit entries spread `auditActor(actor)` so `actorApiKeyId` is recorded alongside the owner.
  - The CI script lives at `apps/web/public/ci/entitled-release.sh` (served at `/ci/entitled-release.sh`; POSIX sh + curl + jq). It must stay ShellCheck-clean and work in `alpine` with `curl jq coreutils`.
- **pg-boss:**
  - Queue names, payload schemas and queue options live in `@entitled/jobs`. The API enqueues and the worker consumes. Handlers parse `job.data` with the schema before using it.
  - Call `createQueue` for every queue at worker startup, with a `deadLetter` queue and an explicit `retryLimit` and `expireInSeconds`.
  - Handlers take an array of jobs and must be idempotent, because a job can run more than once.
- **Artifacts:**
  - Upload flow: `POST /releases/{id}/artifacts` returns a presigned PUT, the client PUTs the bytes to storage, then calls `POST /artifacts/{id}/complete`. The API checks the stored size and enqueues `artifact.checksum`, and the worker streams the object to compute SHA-256 (`pending` → `processing` → `ready` | `failed`).
  - Downloads: `GET /artifacts/{id}/download` checks visibility through `lib/product-access.ts` + `lib/release-visibility.ts`, writes an audit entry, then 302-redirects to a presigned GET (15 min). Clients only ever see `ready` artifacts.
  - Presigned URLs are signed for `S3_PUBLIC_ENDPOINT` (the host browsers and CI reach); server-to-storage calls use `S3_ENDPOINT`. Because the signature covers the host, a proxy in front of storage must pass the Host header through unchanged.
  - Large files never pass through the API process. The platform never signs or verifies artifacts.

- **Runtime portability:** API and worker code prefers web-standard APIs (`fetch`, `Request`, `Response`, `crypto.subtle`, web streams) over Node-only modules when one exists. Runtime-specific code (`@hono/node-server`, `node:` imports, `process`) stays in `main.ts`, `config/env.ts` and `lib/` adapters, so the runtime can change (e.g. to Bun) without touching features.

### Frontend specifics

- **Component format:**
  - Write `<script setup lang="ts">` first, then `<template>`, then `<style>` (rare; prefer Tailwind and Nuxt UI props or `ui` overrides).
  - Declare props with types: `const { size = 'md' } = defineProps<Props>()`.
  - Use `defineModel` for v-model, typed `defineEmits<{ … }>()` and `useTemplateRef`.
- **Forms:** disable the submit button until hydrated (`useIsHydrated`). A native submit before hydration would put credentials in the URL.
- **Routing:** `/api/**` always belongs to the API. Caddy routes it there, and Nitro's `server/routes/api/[...path].ts` proxies it in dev and for SSR. Never add Nitro endpoints under `/api`.
- **Data fetching:**
  - Use `useFetch` / `useAsyncData` for page data in setup, always with an explicit key inside composables. Use `$fetch` only in event handlers.
  - Request paths are same-origin `/api/...`; reuse the contract types (`useFetch<Release[]>`) and keys like `release-${id}` so pages share cached data.
- **State:**
  - No module-level `ref`s, because they leak state between server requests. Use `useState` for small shared state and a Pinia setup store only for complex domain state.
  - Never store server data in a store when `useFetch` already caches it.
- **Nuxt UI:**
  - Use Nuxt UI components before writing custom ones. The vendor admin uses the dashboard primitives (`UDashboardGroup`, `UDashboardSidebar`, `UDashboardPanel`, `UDashboardNavbar`).
  - The app is wrapped in `<UApp>`.
  - Use only semantic colours (`primary`, `neutral`, …) and `--ui-*` variables, never raw palette classes like `text-blue-600`. Branding swaps those tokens at runtime, which is what makes white-labelling work.
- **Markdown:**
  - Docs and changelogs are stored as **Markdown text**, never HTML or TipTap JSON, so import and export stay lossless.
  - The API renders Markdown with `@entitled/markdown` (sanitize, then Shiki) and returns it next to the source (`changelogHtml`). The web app only shows that HTML through `MarkdownContent` and never renders Markdown itself; editors preview via `POST /api/markdown/preview`.
  - Mermaid fences become `<pre class="mermaid">`, which `MarkdownContent` draws in the browser.
  - Icons are bundled (`@iconify-json/lucide`) so offline installs never call the Iconify API.
- **Accessibility:** use semantic elements, give every input a label, keep everything keyboard-reachable, and use role-based selectors in Playwright tests.
- **Copy:** all user-facing strings go through one i18n layer from the start (English only for now). Don't hard-code vendor names, because the portal is white-label.

## Domain rules agents must not break

- **Entitlements gate everything client-facing.** Every query for products, releases, artifacts, docs or threads issued for a client user filters by that user's client account entitlements on the server. A client must never reach another client's data by changing an id (BOLA, OWASP API1). Write a test for every new client-facing endpoint that proves this.
- **Single-tenant:** no `tenant_id` column. One deployment serves one vendor. Branding and module flags are install settings.
- **Phased features stay behind flags** (per install or per product): channels, rollouts, units, OTA. A vendor with nothing enabled sees the plain phase 1 portal. Don't build phase 2+ features unless the task says so.
- **Releases created from CI land as drafts by default.** Auto-publish applies only when the vendor setting enables it.
- **Audit log:** every vendor admin mutation and every artifact download writes an audit entry, in the same transaction as the change.
- Tracking levels (product access, then registered units, then connected devices) build on one another. Never make product-level access depend on the units module.

## Testing

- Unit-test use cases and pure logic with Vitest. Integration-test API routes against a real Postgres (testcontainers or the compose service) through `app.request()`, not mocks of Drizzle.
- API integration tests run against a dedicated `entitled_test` database that `src/test/global-setup.ts` recreates and migrates on every run. Fixtures use unique emails and slugs, so tests never depend on order or clean-up.
- Nuxt components use `@nuxt/test-utils` (`mountSuspended`). End-to-end tests (`apps/web/test/e2e`) use Playwright with role-based locators, against a running stack with demo data. Wait for a form's submit button to be enabled (hydrated) before typing.
- Vitest 5 clears mocks by default and fails on unawaited assertions. Don't fight either behaviour.
- Judge `pnpm check` by its exit code, not by scanning output. Suites that render Markdown use a 30 s `testTimeout`, because the first Shiki load is slow under parallel turbo runs.
- Bug fixes start with a failing test.
- Test names describe behaviour: `it('hides releases outside the client revision range')`.

## Security checklist

- Secrets come only from env, parsed in `config/env.ts`. Commit `.env.example`, never `.env`.
- Authorize on the server for every route. Hiding UI elements is not authorization.
- Use explicit Zod insert and update schemas (no mass assignment). Request bodies use `strictObject`.
- Rate-limit auth with the Better Auth `rateLimit` option, database-backed in production.
- Set upload size limits and content-type checks on presigned uploads. Treat uploaded filenames as untrusted.
- Sanitize rendered Markdown, including docs written by vendor editors.

## Git and PRs

- Write commit messages in Conventional Commits form on a single line with no body: `feat(api): add release publish endpoint`. Don't add AI or co-author attribution.
- Use one logical change per commit and per PR. A PR updates `docs/project-plan.md` or adds an ADR when it changes a decision recorded there.
- **Done means:** `pnpm check` passes, new behaviour has tests, migrations are generated and committed, the OpenAPI document is regenerated if routes changed, and the code contains no stray `console.log` or commented-out code.

## When unsure

Check `docs/project-plan.md`, then the official docs for the pinned version; most libraries here changed a lot in 2025–2026, so don't rely on older examples. If the docs still don't settle it, choose the simplest option that keeps the entitlement model intact, and note the choice in the PR.
