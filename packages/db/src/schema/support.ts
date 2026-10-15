import { bigint, boolean, index, snakeCase, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { organizations, users } from './auth.ts'
import { products } from './catalog.ts'
import { id, timestamps } from './columns.ts'
import { releases } from './releases.ts'

export const supportThreadStatuses = ['open', 'waiting_on_client', 'resolved'] as const

export const supportThreads = snakeCase.table(
  'support_threads',
  {
    id: id(),
    clientAccountId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    releaseId: uuid().references(() => releases.id, { onDelete: 'set null' }),
    subject: text().notNull(),
    status: text({ enum: supportThreadStatuses }).notNull().default('open'),
    createdByUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    lastMessageAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [index().on(t.clientAccountId, t.lastMessageAt), index().on(t.status, t.lastMessageAt)],
)

export const supportMessages = snakeCase.table(
  'support_messages',
  {
    id: id(),
    threadId: uuid()
      .notNull()
      .references(() => supportThreads.id, { onDelete: 'cascade' }),
    authorUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    body: text().notNull(),
    // Internal notes are vendor-only and never reach client users, in the API or by email.
    internal: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.threadId, t.createdAt)],
)

export const supportAttachments = snakeCase.table(
  'support_attachments',
  {
    id: id(),
    // Null until the message that carries it is posted.
    messageId: uuid().references(() => supportMessages.id, { onDelete: 'cascade' }),
    uploadedByUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileName: text().notNull(),
    contentType: text().notNull(),
    sizeBytes: bigint({ mode: 'number' }).notNull(),
    storageKey: text().notNull().unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.messageId)],
)
