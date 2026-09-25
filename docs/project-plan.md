# Entitled: Project Description

Oct 22, 2026 · @Jekabs Oss

## Summary

Entitled is a self-hosted, white-labelable portal where hardware companies give their clients one login for everything after the sale: firmware and software releases, versioned documentation, changelogs and direct support. Vendors get a simple admin side and an API so GitLab CI/CD can publish releases automatically.

The platform is built around **entitlements** (which client has access to which product), not around connected devices. That keeps it usable for companies whose hardware is fully offline and updated by hand, while optional modules add unit registration and OTA check-in for companies that need them.

The MVP is TypeScript end to end: a TypeScript API backend and a Nuxt UI frontend, sharing types and validation schemas.

## Problem and users

Hardware vendors usually spread after-sales material across a file share, a wiki, email threads and a ticket tool. Clients can't tell which firmware applies to their hardware revision, and support keeps asking "which version are you on?".

| User           | Who they are                                    | What they need                                                                     |
| -------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| Client user    | Engineer or technician at a customer company    | Find the right firmware and docs for their product, read what changed, ask support |
| Client admin   | Person managing the customer account            | Invite colleagues, see what the company has access to                              |
| Vendor editor  | Engineer or tech writer at the hardware company | Write docs and changelogs, upload releases quickly                                 |
| Vendor support | Support staff                                   | Answer threads with full context on product and version                            |
| Vendor admin   | Owner of the portal                             | Manage clients, entitlements, branding, modules, API tokens                        |
| CI pipeline    | GitLab CI/CD job                                | Create and publish releases without a human                                        |

## Core concepts

Everything hangs off entitlements; devices are an optional layer that a company switches on per product.

### Entities

- **Tenant:** one install per hardware company; single-tenant for now, so each deployment serves one vendor with its own branding, domain and modules.
- **Client account:** a customer company, with its own users and roles.
- **Product:** something the vendor sells, with **hardware revisions** (rev A, B, C).
- **Entitlement:** client account X has access to product Y, optionally limited to certain revisions or channels.
- **Release:** a version of a product with changelog, compatibility rules (revision range, minimum bootloader, required intermediate version), channel and one or more artifacts.
- **Artifact:** any file attached to a release (.bin, .hex, .tar, .exe, flashing script), each with SHA-256 checksum and signature.
- **Channel:** stable, beta, or a private channel visible to one client.
- **Doc space:** documentation per product, versioned per firmware version.
- **Support thread:** a conversation tied to a product and version (and a unit, if registered).

### Tracking levels, chosen per product

| Level                           | What the vendor knows                 | Example                               |
| ------------------------------- | ------------------------------------- | ------------------------------------- |
| 1. Product access (default)     | Client X owns product Y               | Offline devices, manual USB flashing  |
| 2. Registered units (optional)  | Client X has serials A, B, C on rev C | Per-unit history, warranty, RMA       |
| 3. Connected devices (optional) | Units check in themselves             | Devices with network access, real OTA |

A release targets "product Y, revisions B to D" and a client sees it if they are entitled to Y. With registered units the portal adds detail such as "your rev A unit can't use this".

## Feature list

Phase 1 is the MVP; every later feature sits behind a per-install or per-product flag so a simple vendor sees a simple portal.

| Feature                                                                                                                                                                                                         | Area          | Phase |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| Login with invite-only accounts, roles (client user, client admin, vendor editor, support, admin), 2FA                                                                                                          | Accounts      | 1     |
| Client accounts and entitlements to products and revisions                                                                                                                                                      | Accounts      | 1     |
| Products and hardware revisions                                                                                                                                                                                 | Catalog       | 1     |
| Releases with Markdown changelog, revision range, draft and publish; a setting decides whether new releases (including from CI) land as draft (default) or publish straight to clients                          | Releases      | 1     |
| Artifact upload (any file type, several per release) with SHA-256 checksums                                                                                                                                     | Releases      | 1     |
| Manual install instructions per release (section or linked doc page)                                                                                                                                            | Releases      | 1     |
| Docs editor with full GitHub-flavored Markdown: tables, task lists, code blocks with syntax highlighting, Mermaid diagrams, callouts, image drag-and-drop, video embeds, live preview, import and export as .md | Docs          | 1     |
| Support threads tied to product and version, file attachments, internal notes                                                                                                                                   | Support       | 1     |
| Email notifications for new replies                                                                                                                                                                             | Support       | 1     |
| CI release API with scoped tokens, plus a ready-made `.gitlab-ci.yml` snippet                                                                                                                                   | Automation    | 1     |
| Basic branding: logo, colors, portal name                                                                                                                                                                       | White-label   | 1     |
| Audit log of admin actions and downloads                                                                                                                                                                        | Platform      | 1     |
| Signature or checksum files attached as normal artifacts (the platform stores and serves them, it does not sign or verify)                                                                                      | Releases      | 2     |
| Release channels: stable, beta, private per client                                                                                                                                                              | Releases      | 2     |
| Staged rollouts by client group, with timed or manual promotion                                                                                                                                                 | Releases      | 2     |
| Compatibility rules (minimum bootloader, required intermediate version) shown as warnings                                                                                                                       | Releases      | 2     |
| Docs versioned per firmware version, "copy to next version", full-text search                                                                                                                                   | Docs          | 2     |
| Realtime support chat (SSE), assignment, canned replies                                                                                                                                                         | Support       | 2     |
| Email alerts to clients when a release for their product is published                                                                                                                                           | Notifications | 2     |
| Outgoing webhooks (release published, ticket created)                                                                                                                                                           | Automation    | 2     |
| CLI for CI: `release create --from-tag`, changelog from tag or `CHANGELOG.md`                                                                                                                                   | Automation    | 2     |
| Custom domain, email sender, full theming                                                                                                                                                                       | White-label   | 2     |
| Registered units module: serials, revision, per-unit history, CSV import                                                                                                                                        | Units         | 3     |
| Warranty status and RMA requests per serial                                                                                                                                                                     | Units         | 3     |
| Device check-in API with device tokens (OTA module)                                                                                                                                                             | OTA           | 4     |
| Percentage rollouts and enforced compatibility for connected devices                                                                                                                                            | OTA           | 4     |
| Download and version analytics per client                                                                                                                                                                       | Insights      | 4     |
| SBOM and security advisories per release                                                                                                                                                                        | Compliance    | 4     |

## Tech stack

TypeScript end to end for the MVP, with the API defined as an OpenAPI contract so the backend could later be rewritten (for example in Go) without touching the frontend or CI integrations.

| Layer           | Choice                                                           | Why                                                                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo        | pnpm workspaces + Turborepo                                      | Shared types and Zod schemas between API, web and CLI                                                                                                                                                                         |
| Frontend        | Nuxt 4 + Nuxt UI v4                                              | Dashboard and docs-style components out of the box, Tailwind v4 theming fits white-labeling                                                                                                                                   |
| Docs editor     | Nuxt UI Editor (TipTap-based, Markdown content)                  | Built into Nuxt UI since v4.3 ([releases](https://ui.nuxt.com/releases)); stores Markdown, extended with TipTap for Mermaid, callouts and code highlighting; rendered with a remark/rehype pipeline so docs stay portable .md |
| Backend API     | Node.js + Hono with `@hono/zod-openapi`                          | Small, fast, OpenAPI generated from the same Zod schemas                                                                                                                                                                      |
| Database        | PostgreSQL + Drizzle ORM                                         | Typed queries, SQL migrations, full-text search for docs in phase 2                                                                                                                                                           |
| Auth            | Better Auth (organizations, invites, 2FA)                        | Fits invite-only client accounts; API tokens for CI handled separately                                                                                                                                                        |
| File storage    | S3-compatible (MinIO or Garage self-hosted, any S3 in cloud)     | Artifacts served via presigned URLs, never through the API process                                                                                                                                                            |
| Background jobs | pg-boss on PostgreSQL                                            | Outbox pattern without adding Redis: emails, webhooks, rollout promotion                                                                                                                                                      |
| Realtime        | Server-Sent Events                                               | Support chat and live notifications, simple behind proxies                                                                                                                                                                    |
| Email           | Nodemailer over SMTP                                             | Works with any provider or self-hosted mail                                                                                                                                                                                   |
| Integrity       | SHA-256 checksums computed on upload; no signing in the platform | Platform only stores and delivers files; vendors attach their own signatures as artifacts                                                                                                                                     |
| Testing         | Vitest, Playwright                                               | Unit and end-to-end                                                                                                                                                                                                           |
| Deployment      | Docker Compose behind Caddy                                      | One command self-hosting for vendors, automatic TLS                                                                                                                                                                           |

## Architecture

&#91;embedded content: architecture · web, API, storage, worker\]

Caddy terminates TLS in front of the web app and API. Artifacts download straight from storage via presigned URLs, so large files never pass through the API; the dashed device path arrives only in phase 4.

## Phase plan

&#91;embedded content: phase plan · 4 phases, 3 gates\]

Phases are gated by real demand, not dates: phase 1 is done when a pilot vendor publishes releases from GitLab CI and their clients use the portal. The full scope of each phase is in the feature list above.

## Decisions

- **Tenancy:** single-tenant for now. One deployment per vendor; no tenant\_id in the schema yet.
- **Signing:** the platform does not sign or verify anything. It stores releases and delivers them to entitled clients. Vendors can attach their own signature files as artifacts.
- **Draft or publish:** new releases land as drafts by default; a setting lets the vendor publish straight to clients instead, including releases created from CI.
- **Docs:** full, proper Markdown in phase 1 (GFM tables, code highlighting, Mermaid, callouts, embeds), compatible with other Markdown tools through import and export.
- **Name:** Entitled, named after the entitlement model at its core.
