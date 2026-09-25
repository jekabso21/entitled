import { index, primaryKey, snakeCase, unique, uuid } from 'drizzle-orm/pg-core'
import { organizations } from './auth.ts'
import { hardwareRevisions, products } from './catalog.ts'
import { id, timestamps } from './columns.ts'

export const entitlements = snakeCase.table(
  'entitlements',
  {
    id: id(),
    clientAccountId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [unique().on(t.clientAccountId, t.productId), index().on(t.productId)],
)

// An entitlement without rows here covers every revision of the product.
export const entitlementRevisions = snakeCase.table(
  'entitlement_revisions',
  {
    entitlementId: uuid()
      .notNull()
      .references(() => entitlements.id, { onDelete: 'cascade' }),
    revisionId: uuid()
      .notNull()
      .references(() => hardwareRevisions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.entitlementId, t.revisionId] })],
)
