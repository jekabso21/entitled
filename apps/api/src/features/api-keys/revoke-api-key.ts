import { apikeys } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function revokeApiKey({ tx }: TransactionScope, actor: Actor, apiKeyId: string) {
  const removed = await tx
    .delete(apikeys)
    .where(eq(apikeys.id, apiKeyId))
    .returning({ name: apikeys.name })
  if (removed.length === 0) throw new DomainError('not_found', 'API key not found')
  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'api_key.revoked',
    subjectType: 'api_key',
    subjectId: apiKeyId,
    metadata: { name: removed[0]?.name },
  })
}
