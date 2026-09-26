import type { AcceptInvitationInput } from '@entitled/contracts/invitations'
import { accountInvitations, members, users } from '@entitled/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { recordAudit } from '#lib/audit.ts'
import { createCredentialUser } from '#lib/create-credential-user.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { findPendingInvitationByToken } from './invitation-queries.ts'

type AcceptInvitationRequest = {
  token: string
  actor: Actor | null
  newUser: AcceptInvitationInput | null
}

export async function acceptInvitation({ tx }: TransactionScope, request: AcceptInvitationRequest) {
  const found = await findPendingInvitationByToken(tx, request.token)
  if (!found) throw new DomainError('not_found', 'Invitation is invalid or has expired')
  const { invitation } = found

  // Claim the invitation first so two concurrent accepts cannot both succeed.
  const claimed = await tx
    .update(accountInvitations)
    .set({ acceptedAt: new Date() })
    .where(and(eq(accountInvitations.id, invitation.id), isNull(accountInvitations.acceptedAt)))
    .returning({ id: accountInvitations.id })
  if (claimed.length === 0) throw new DomainError('conflict', 'Invitation was already accepted')

  const { userId, isNewUser } = await resolveUser(tx, invitation.email, request)

  if (invitation.kind === 'vendor') {
    await tx.update(users).set({ vendorRole: invitation.vendorRole }).where(eq(users.id, userId))
  } else if (invitation.clientAccountId && invitation.clientRole) {
    await tx
      .insert(members)
      .values({
        organizationId: invitation.clientAccountId,
        userId,
        role: invitation.clientRole,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
  }

  await recordAudit(tx, {
    actorUserId: userId,
    action: 'invitation.accepted',
    subjectType: 'invitation',
    subjectId: invitation.id,
    metadata: { kind: invitation.kind },
  })

  return { userId, email: invitation.email, isNewUser }
}

async function resolveUser(
  tx: TransactionScope['tx'],
  email: string,
  request: AcceptInvitationRequest,
) {
  const [existing] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing) {
    if (request.actor?.userId !== existing.id) {
      throw new DomainError('forbidden', 'Sign in as the invited user to accept this invitation')
    }
    return { userId: existing.id, isNewUser: false }
  }
  if (!request.newUser) throw new DomainError('invalid_state', 'Name and password are required')
  const user = await createCredentialUser(tx, {
    name: request.newUser.name,
    email,
    password: request.newUser.password,
    vendorRole: null,
  })
  return { userId: user.id, isNewUser: true }
}
