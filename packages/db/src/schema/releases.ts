import {
  bigint,
  index,
  primaryKey,
  snakeCase,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { organizations } from './auth.ts'
import { hardwareRevisions, products } from './catalog.ts'
import { id, timestamps } from './columns.ts'

export const releaseStatuses = ['draft', 'published', 'archived'] as const

// entitled: every client account entitled to the product. selected: only the accounts in
// release_client_accounts, and only while they are entitled to the product too.
export const releaseAudiences = ['entitled', 'selected'] as const

// pending: URL issued, bytes not confirmed. processing: uploaded, checksum running.
export const artifactStatuses = ['pending', 'processing', 'ready', 'failed'] as const

export const releases = snakeCase.table(
  'releases',
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    version: text().notNull(),
    title: text().notNull().default(''),
    status: text({ enum: releaseStatuses }).notNull().default('draft'),
    audience: text({ enum: releaseAudiences }).notNull().default('entitled'),
    changelog: text().notNull().default(''),
    installInstructions: text().notNull().default(''),
    // A null bound leaves that side of the revision range open.
    minRevisionId: uuid().references(() => hardwareRevisions.id, { onDelete: 'set null' }),
    maxRevisionId: uuid().references(() => hardwareRevisions.id, { onDelete: 'set null' }),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [unique().on(t.productId, t.version), index().on(t.productId, t.status)],
)

export const releaseClientAccounts = snakeCase.table(
  'release_client_accounts',
  {
    releaseId: uuid()
      .notNull()
      .references(() => releases.id, { onDelete: 'cascade' }),
    clientAccountId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.releaseId, t.clientAccountId] }), index().on(t.clientAccountId)],
)

export const artifacts = snakeCase.table(
  'artifacts',
  {
    id: id(),
    releaseId: uuid()
      .notNull()
      .references(() => releases.id, { onDelete: 'cascade' }),
    fileName: text().notNull(),
    contentType: text().notNull(),
    sizeBytes: bigint({ mode: 'number' }).notNull(),
    status: text({ enum: artifactStatuses }).notNull().default('pending'),
    // Computed by the worker from the stored object; null until processing finishes.
    sha256: text(),
    // Optional checksum supplied by the uploader; a mismatch marks the artifact failed.
    expectedSha256: text(),
    storageKey: text().notNull().unique(),
    ...timestamps,
  },
  (t) => [index().on(t.releaseId)],
)
