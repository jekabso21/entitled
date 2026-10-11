import { entitlements } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function revokeEntitlement(
  { tx }: TransactionScope,
  actor: Actor,
  entitlementId: string,
) {
  const [removed] = await tx
    .delete(entitlements)
    .where(eq(entitlements.id, entitlementId))
    .returning()
  if (!removed) throw new DomainError('not_found', 'Entitlement not found')

  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'entitlement.revoked',
    subjectType: 'client_account',
    subjectId: removed.clientAccountId,
    metadata: { productId: removed.productId },
  })
}
