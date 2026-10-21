import type { Queryable } from '@entitled/db'
import { members } from '@entitled/db/schema'
import { and, eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { DomainError } from '#lib/domain-error.ts'

// Vendor admins manage every account; client admins manage only their own.
export async function assertCanManageAccount(db: Queryable, actor: Actor, clientAccountId: string) {
  if (actor.vendorRole === 'admin') return
  const [membership] = await db
    .select({ role: members.role })
    .from(members)
    .where(and(eq(members.userId, actor.userId), eq(members.organizationId, clientAccountId)))
  if (membership?.role !== 'admin') {
    throw new DomainError('forbidden', 'Only admins of this client account can manage it')
  }
}

export async function assertKeepsAnAdmin(db: Queryable, clientAccountId: string, userId: string) {
  const admins = await db
    .select({ userId: members.userId })
    .from(members)
    .where(and(eq(members.organizationId, clientAccountId), eq(members.role, 'admin')))
  if (admins.length === 1 && admins[0]?.userId === userId) {
    throw new DomainError('invalid_state', 'An account needs at least one client admin')
  }
}
