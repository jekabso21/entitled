import type { VendorRole } from '@entitled/contracts/accounts'
import { users } from '@entitled/db/schema'
import { and, eq, ne } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import { endUserSessions } from '#lib/end-user-sessions.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function updateVendorStaff(
  { tx }: TransactionScope,
  actor: Actor,
  userId: string,
  vendorRole: VendorRole | null,
) {
  if (userId === actor.userId) {
    throw new DomainError('invalid_state', 'Ask another vendor admin to change your own access')
  }
  const [target] = await tx
    .select({ vendorRole: users.vendorRole })
    .from(users)
    .where(eq(users.id, userId))
    .for('update')
  if (!target?.vendorRole) throw new DomainError('not_found', 'Staff member not found')

  if (target.vendorRole === 'admin' && vendorRole !== 'admin') {
    const otherAdmins = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.vendorRole, 'admin'), ne(users.id, userId)))
    if (otherAdmins.length === 0) {
      throw new DomainError('invalid_state', 'The portal needs at least one vendor admin')
    }
  }

  await tx.update(users).set({ vendorRole }).where(eq(users.id, userId))
  if (vendorRole === null) await endUserSessions(tx, userId)

  await recordAudit(tx, {
    ...auditActor(actor),
    action: vendorRole ? 'vendor_staff.role_changed' : 'vendor_staff.removed',
    subjectType: 'user',
    subjectId: userId,
    metadata: { from: target.vendorRole, to: vendorRole },
  })
}
