import { db } from '#lib/db.ts'
import { findSupportThread } from './support-queries.ts'
import type { SupportScope } from './support-access.ts'

export async function loadThreadFor(scope: SupportScope, threadId: string) {
  const thread = await findSupportThread(db, scope, threadId)
  if (!thread) throw new Error(`Thread ${threadId} vanished after a write`)
  return thread
}
