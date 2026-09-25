import { integer, snakeCase, text, unique, uuid } from 'drizzle-orm/pg-core'
import { id, timestamps } from './columns.ts'

export const products = snakeCase.table('products', {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text().notNull().default(''),
  ...timestamps,
})

export const hardwareRevisions = snakeCase.table(
  'hardware_revisions',
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    code: text().notNull(),
    name: text().notNull(),
    // Release revision ranges compare positions, so codes can be renamed without breaking ranges.
    position: integer().notNull(),
    ...timestamps,
  },
  (t) => [unique().on(t.productId, t.code), unique().on(t.productId, t.position)],
)
