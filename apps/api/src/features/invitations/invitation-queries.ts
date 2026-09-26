import { type Invitation, invitationSchema } from '@entitled/contracts/invitations'
import type { Queryable } from '@entitled/db'
import { accountInvitations, organizations } from '@entitled/db/schema'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { toIso } from '#lib/serialize-date.ts'
import { hashInvitationToken } from './invitation-token.ts'

type InvitationRow = typeof accountInvitations.$inferSelect

export function toInvitation(row: InvitationRow): Invitation {
  return invitationSchema.parse({
    id: row.id,
    email: row.email,
    kind: row.kind,
    vendorRole: row.vendorRole,
    clientAccountId: row.clientAccountId,
    clientRole: row.clientRole,
    expiresAt: toIso(row.expiresAt),
    acceptedAt: toIso(row.acceptedAt),
    createdAt: toIso(row.createdAt),
  })
}

const isPending = () =>
  and(
    isNull(accountInvitations.acceptedAt),
    isNull(accountInvitations.revokedAt),
    gt(accountInvitations.expiresAt, new Date()),
  )

export async function findPendingInvitationByToken(db: Queryable, token: string) {
  const tokenHash = await hashInvitationToken(token)
  const [row] = await db
    .select({ invitation: accountInvitations, accountName: organizations.name })
    .from(accountInvitations)
    .leftJoin(organizations, eq(organizations.id, accountInvitations.clientAccountId))
    .where(and(eq(accountInvitations.tokenHash, tokenHash), isPending()))
  return row
}

export async function listPendingInvitations(db: Queryable, clientAccountId?: string) {
  const rows = await db
    .select()
    .from(accountInvitations)
    .where(
      and(
        isPending(),
        clientAccountId ? eq(accountInvitations.clientAccountId, clientAccountId) : undefined,
      ),
    )
    .orderBy(desc(accountInvitations.createdAt))
  return rows.map(toInvitation)
}
