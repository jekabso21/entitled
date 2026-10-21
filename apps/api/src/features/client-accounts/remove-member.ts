import { members } from '@entitled/db/schema'
import { and, eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { assertCanManageAccount, assertKeepsAnAdmin } from '#lib/account-management-access.ts'

export async function removeMember(
  { tx }: TransactionScope,
  actor: Actor,
  clientAccountId: string,
  userId: string,
) {
  await assertCanManageAccount(tx, actor, clientAccountId)
  if (actor.vendorRole !== 'admin') await assertKeepsAnAdmin(tx, clientAccountId, userId)

  const removed = await tx
    .delete(members)
    .where(and(eq(members.organizationId, clientAccountId), eq(members.userId, userId)))
    .returning({ id: members.id })
  if (removed.length === 0) throw new DomainError('not_found', 'Member not found')

  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'member.removed',
    subjectType: 'client_account',
    subjectId: clientAccountId,
    metadata: { userId },
  })
}
