import type { Queryable } from '@entitled/db'
import { auditLog } from '@entitled/db/schema'

export type AuditEntry = {
  actorUserId: string | null
  action: string
  subjectType: string
  subjectId: string | null
  metadata?: Record<string, unknown>
}

export async function recordAudit(tx: Queryable, entry: AuditEntry) {
  await tx.insert(auditLog).values({ ...entry, metadata: entry.metadata ?? {} })
}
