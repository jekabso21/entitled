import type { SupportThreadStatus } from '@entitled/contracts/support'
import { supportThreads } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { canSeeThread, loadSupportScope } from './support-access.ts'

export async function updateSupportThreadStatus(
  { tx }: TransactionScope,
  actor: Actor,
  threadId: string,
  status: SupportThreadStatus,
) {
  const access = await loadSupportScope(tx, actor)
  const [thread] = await tx.select().from(supportThreads).where(eq(supportThreads.id, threadId))
  if (!thread || !canSeeThread(access, thread))
    throw new DomainError('not_found', 'Thread not found')
  // Clients may resolve or reopen their own requests but not mark them as waiting on themselves.
  if (access.kind === 'client' && status === 'waiting_on_client') {
    throw new DomainError('forbidden', 'Only vendor staff can set this status')
  }
  await tx.update(supportThreads).set({ status }).where(eq(supportThreads.id, threadId))
}
