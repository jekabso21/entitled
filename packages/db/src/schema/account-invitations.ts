import { sql } from 'drizzle-orm'
import { check, index, snakeCase, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { organizations, users } from './auth.ts'
import { id, timestamps } from './columns.ts'

export const invitationKinds = ['vendor', 'client'] as const

export const accountInvitations = snakeCase.table(
  'account_invitations',
  {
    id: id(),
    kind: text({ enum: invitationKinds }).notNull(),
    email: text().notNull(),
    // Only the SHA-256 of the emailed token is stored, so a database leak cannot be replayed as invites.
    tokenHash: text().notNull().unique(),
    vendorRole: text(),
    clientAccountId: uuid().references(() => organizations.id, { onDelete: 'cascade' }),
    clientRole: text(),
    invitedByUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    acceptedAt: timestamp({ withTimezone: true }),
    revokedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index().on(t.email),
    index().on(t.clientAccountId),
    check(
      'account_invitations_kind_fields',
      sql`(${t.kind} = 'vendor' and ${t.vendorRole} is not null and ${t.clientAccountId} is null)
        or (${t.kind} = 'client' and ${t.clientAccountId} is not null and ${t.clientRole} is not null)`,
    ),
  ],
)
