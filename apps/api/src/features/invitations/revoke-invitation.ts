import { accountInvitations } from '@entitled/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { assertCanManageAccount } from '#lib/account-management-access.ts'

export async function revokeInvitation(
  { tx }: TransactionScope,
  actor: Actor,
  invitationId: string,
) {
  const [invitation] = await tx
    .select()
    .from(accountInvitations)
    .where(eq(accountInvitations.id, invitationId))
  if (!invitation) throw new DomainError('not_found', 'Invitation not found')

  if (invitation.clientAccountId)
    await assertCanManageAccount(tx, actor, invitation.clientAccountId)
  else if (actor.vendorRole !== 'admin') {
    throw new DomainError('forbidden', 'Only vendor admins manage staff invitations')
  }

  const revoked = await tx
    .update(accountInvitations)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(accountInvitations.id, invitationId),
        isNull(accountInvitations.acceptedAt),
        isNull(accountInvitations.revokedAt),
      ),
    )
    .returning({ id: accountInvitations.id })
  if (revoked.length === 0)
    throw new DomainError('invalid_state', 'Invitation is no longer pending')

  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'invitation.revoked',
    subjectType: 'invitation',
    subjectId: invitationId,
    metadata: { email: invitation.email },
  })
}
