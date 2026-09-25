import { index, jsonb, snakeCase, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { id } from './columns.ts'

export const auditLog = snakeCase.table(
  'audit_log',
  {
    id: id(),
    // Exactly one actor is set: a signed-in user or a CI API key.
    actorUserId: uuid(),
    actorApiKeyId: uuid(),
    action: text().notNull(),
    subjectType: text().notNull(),
    subjectId: uuid(),
    metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.subjectType, t.subjectId), index().on(t.createdAt)],
)
