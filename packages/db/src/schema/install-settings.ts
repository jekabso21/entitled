import { sql } from 'drizzle-orm'
import { boolean, check, integer, snakeCase, timestamp } from 'drizzle-orm/pg-core'

// Single-row table: one install serves one vendor.
export const installSettings = snakeCase.table(
  'install_settings',
  {
    id: integer().primaryKey().default(1),
    autoPublishReleases: boolean().notNull().default(false),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check('install_settings_single_row', sql`${t.id} = 1`)],
)
