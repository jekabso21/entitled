import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  bigint,
  index,
  integer,
  snakeCase,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from './auth.ts'
import { products } from './catalog.ts'
import { id, timestamps } from './columns.ts'

export const docPageStatuses = ['draft', 'published'] as const

export const docPages = snakeCase.table(
  'doc_pages',
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    // Null for top-level pages. Deleting a page deletes its sub-pages.
    parentId: uuid().references((): AnyPgColumn => docPages.id, { onDelete: 'cascade' }),
    slug: text().notNull(),
    title: text().notNull(),
    // One or two sentences shown in page lists and search results.
    description: text().notNull().default(''),
    // Stored as Markdown so pages import and export losslessly.
    body: text().notNull().default(''),
    status: text({ enum: docPageStatuses }).notNull().default('draft'),
    position: integer().notNull().default(0),
    updatedByUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    unique().on(t.productId, t.slug),
    index().on(t.productId, t.position),
    index().on(t.parentId),
    // Must match the expression the docs search queries, or Postgres skips the index.
    index('doc_pages_search_idx').using(
      'gin',
      sql`(setweight(to_tsvector('simple', ${t.title}), 'A') || setweight(to_tsvector('simple', ${t.body}), 'B'))`,
    ),
  ],
)

// A snapshot of a page's title and body after each save, so editors can compare and restore.
export const docPageRevisions = snakeCase.table(
  'doc_page_revisions',
  {
    id: id(),
    pageId: uuid()
      .notNull()
      .references(() => docPages.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    body: text().notNull(),
    createdByUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.pageId, t.createdAt)],
)

// Images and videos embedded in doc pages; served only to people who can see the product.
export const docAssets = snakeCase.table(
  'doc_assets',
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    fileName: text().notNull(),
    contentType: text().notNull(),
    sizeBytes: bigint({ mode: 'number' }).notNull(),
    storageKey: text().notNull().unique(),
    uploadedByUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.productId)],
)
