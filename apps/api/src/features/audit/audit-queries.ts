import type { AuditPage } from '@entitled/contracts/audit'
import type { Queryable } from '@entitled/db'
import { auditLog, users } from '@entitled/db/schema'
import { and, desc, eq, like, lt } from 'drizzle-orm'

type AuditFilter = { cursor?: string | undefined; limit: number; action?: string | undefined }

export async function listAuditEntries(db: Queryable, filter: AuditFilter): Promise<AuditPage> {
  const rows = await db
    .select({ entry: auditLog, actorEmail: users.email })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorUserId))
    .where(
      and(
        filter.cursor ? lt(auditLog.id, filter.cursor) : undefined,
        filter.action ? like(auditLog.action, `${filter.action}%`) : undefined,
      ),
    )
    .orderBy(desc(auditLog.id))
    .limit(filter.limit + 1)

  const page = rows.slice(0, filter.limit)
  return {
    entries: page.map(({ entry, actorEmail }) => ({
      id: entry.id,
      action: entry.action,
      subjectType: entry.subjectType,
      subjectId: entry.subjectId,
      actorEmail,
      viaApiKey: entry.actorApiKeyId !== null,
      metadata: entry.metadata,
      createdAt: entry.createdAt.toISOString(),
    })),
    nextCursor: rows.length > filter.limit ? (page.at(-1)?.entry.id ?? null) : null,
  }
}
