import { bigint, index, snakeCase, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { hardwareRevisions, products } from './catalog.ts'
import { id, timestamps } from './columns.ts'

export const releaseStatuses = ['draft', 'published', 'archived'] as const

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
    sha256: text().notNull(),
    storageKey: text().notNull().unique(),
    ...timestamps,
  },
  (t) => [index().on(t.releaseId)],
)
