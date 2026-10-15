import type { Queryable } from '@entitled/db'
import { members } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'

// Vendor staff see every thread; client users see the threads of their own accounts.
export type SupportScope = { kind: 'vendor' } | { kind: 'client'; accountIds: ReadonlySet<string> }

export async function loadSupportScope(db: Queryable, actor: Actor): Promise<SupportScope> {
  if (actor.vendorRole) return { kind: 'vendor' }
  const rows = await db
    .select({ accountId: members.organizationId })
    .from(members)
    .where(eq(members.userId, actor.userId))
  return { kind: 'client', accountIds: new Set(rows.map((row) => row.accountId)) }
}

export function canSeeThread(scope: SupportScope, thread: { clientAccountId: string }) {
  return scope.kind === 'vendor' || scope.accountIds.has(thread.clientAccountId)
}
