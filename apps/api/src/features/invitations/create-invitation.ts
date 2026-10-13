import type { CreateInvitationInput, Invitation } from '@entitled/contracts/invitations'
import { accountInvitations, members, organizations, users } from '@entitled/db/schema'
import { and, eq } from 'drizzle-orm'
import { env } from '#config/env.ts'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import { getBranding } from '#lib/install-settings.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { buildInvitationEmail } from './invitation-email.ts'
import { toInvitation } from './invitation-queries.ts'
import { generateInvitationToken } from './invitation-token.ts'

const INVITATION_TTL_MS = 7 * 24 * 3600 * 1000

export async function createInvitation(
  { tx, enqueue }: TransactionScope,
  actor: Actor,
  input: CreateInvitationInput,
): Promise<Invitation> {
  // Authorize before loading the account so non-admins learn nothing about other accounts.
  await assertCanInvite(tx, actor, input)
  const accountName =
    input.kind === 'client' ? await loadAccountName(tx, input.clientAccountId) : null
  await assertNotAlreadyJoined(tx, input)

  const { token, tokenHash } = await generateInvitationToken()
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS)
  const [row] = await tx
    .insert(accountInvitations)
    .values({
      kind: input.kind,
      email: input.email,
      tokenHash,
      vendorRole: input.kind === 'vendor' ? input.vendorRole : null,
      clientAccountId: input.kind === 'client' ? input.clientAccountId : null,
      clientRole: input.kind === 'client' ? input.clientRole : null,
      invitedByUserId: actor.userId,
      expiresAt,
    })
    .returning()
  if (!row) throw new Error('Invitation insert returned no row')

  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'invitation.created',
    subjectType: 'invitation',
    subjectId: row.id,
    metadata: { email: input.email, kind: input.kind },
  })

  const [inviter] = await tx
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, actor.userId))
  const email = buildInvitationEmail({
    portalName: (await getBranding(tx)).portalName,
    inviterName: inviter?.name ?? 'An administrator',
    accountName,
    link: new URL(`/invite/${token}`, env.WEB_URL).toString(),
    expiresAt,
  })
  await enqueue('email.send', { to: input.email, ...email })

  return toInvitation(row)
}

async function loadAccountName(tx: TransactionScope['tx'], clientAccountId: string) {
  const [account] = await tx
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, clientAccountId))
  if (!account) throw new DomainError('not_found', 'Client account not found')
  return account.name
}

async function assertCanInvite(
  tx: TransactionScope['tx'],
  actor: Actor,
  input: CreateInvitationInput,
) {
  if (actor.vendorRole === 'admin') return
  if (input.kind === 'vendor') throw new DomainError('forbidden', 'Only vendor admins invite staff')

  const [membership] = await tx
    .select({ role: members.role })
    .from(members)
    .where(and(eq(members.userId, actor.userId), eq(members.organizationId, input.clientAccountId)))
  if (membership?.role !== 'admin') {
    throw new DomainError('forbidden', 'Only admins of this client account can invite')
  }
}

async function assertNotAlreadyJoined(tx: TransactionScope['tx'], input: CreateInvitationInput) {
  const [user] = await tx
    .select({ id: users.id, vendorRole: users.vendorRole })
    .from(users)
    .where(eq(users.email, input.email))
  if (!user) return
  if (input.kind === 'vendor') {
    if (user.vendorRole) throw new DomainError('conflict', 'This person is already vendor staff')
    return
  }
  const [membership] = await tx
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.userId, user.id), eq(members.organizationId, input.clientAccountId)))
  if (membership) throw new DomainError('conflict', 'This person is already a member')
}
