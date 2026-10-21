import type { ClientRole } from '@entitled/contracts/accounts'
import { members } from '@entitled/db/schema'
import { and, eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { assertCanManageAccount, assertKeepsAnAdmin } from '#lib/account-management-access.ts'

export async function updateMemberRole(
  { tx }: TransactionScope,
  actor: Actor,
  clientAccountId: string,
  userId: string,
  role: ClientRole,
) {
  await assertCanManageAccount(tx, actor, clientAccountId)
  if (role !== 'admin') await assertKeepsAnAdmin(tx, clientAccountId, userId)

  const updated = await tx
    .update(members)
    .set({ role })
    .where(and(eq(members.organizationId, clientAccountId), eq(members.userId, userId)))
    .returning({ id: members.id })
  if (updated.length === 0) throw new DomainError('not_found', 'Member not found')

  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'member.role_changed',
    subjectType: 'client_account',
    subjectId: clientAccountId,
    metadata: { userId, role },
  })
}
