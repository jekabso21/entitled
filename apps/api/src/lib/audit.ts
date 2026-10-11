import type { Queryable } from '@entitled/db'
import { auditLog } from '@entitled/db/schema'
import type { Actor } from '#lib/actor.ts'

export type AuditEntry = {
  actorUserId: string | null
  actorApiKeyId?: string | null
  action: string
  subjectType: string
  subjectId: string | null
  metadata?: Record<string, unknown>
}

export async function recordAudit(tx: Queryable, entry: AuditEntry) {
  await tx.insert(auditLog).values({ ...entry, metadata: entry.metadata ?? {} })
}

export function auditActor(actor: Pick<Actor, 'userId' | 'apiKeyId'>) {
  return { actorUserId: actor.userId, actorApiKeyId: actor.apiKeyId }
}
