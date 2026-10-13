import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  customType,
  integer,
  snakeCase,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

const bytea = customType<{ data: Buffer }>({ dataType: () => 'bytea' })

// Single-row table: one install serves one vendor.
export const installSettings = snakeCase.table(
  'install_settings',
  {
    id: integer().primaryKey().default(1),
    autoPublishReleases: boolean().notNull().default(false),
    portalName: text().notNull().default('Entitled'),
    primaryColor: text().notNull().default('indigo'),
    // Small images only (capped by the API); kept in Postgres so backups include branding.
    logo: bytea(),
    logoContentType: text(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check('install_settings_single_row', sql`${t.id} = 1`)],
)
