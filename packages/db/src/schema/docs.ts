import {
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
    slug: text().notNull(),
    title: text().notNull(),
    // Stored as Markdown so pages import and export losslessly.
    body: text().notNull().default(''),
    status: text({ enum: docPageStatuses }).notNull().default('draft'),
    position: integer().notNull().default(0),
    updatedByUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [unique().on(t.productId, t.slug), index().on(t.productId, t.position)],
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
