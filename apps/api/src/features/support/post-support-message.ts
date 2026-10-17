import type { PostSupportMessageInput } from '@entitled/contracts/support'
import { supportMessages, supportThreads, users } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { linkAttachments } from './link-attachments.ts'
import { notifySupportMessage } from './notify-support-message.ts'
import { canSeeThread, loadSupportScope } from './support-access.ts'

export async function postSupportMessage(
  scope: TransactionScope,
  actor: Actor,
  threadId: string,
  input: PostSupportMessageInput,
) {
  const { tx } = scope
  const access = await loadSupportScope(tx, actor)
  const [thread] = await tx
    .select()
    .from(supportThreads)
    .where(eq(supportThreads.id, threadId))
    .for('update')
  if (!thread || !canSeeThread(access, thread))
    throw new DomainError('not_found', 'Thread not found')

  const fromVendor = access.kind === 'vendor'
  if (input.internal && !fromVendor) {
    throw new DomainError('forbidden', 'Only vendor staff can write internal notes')
  }

  const [message] = await tx
    .insert(supportMessages)
    .values({ threadId, authorUserId: actor.userId, body: input.body, internal: input.internal })
    .returning({ id: supportMessages.id })
  if (!message) throw new Error('Message insert returned no row')
  await linkAttachments(tx, actor, message.id, input.attachmentIds)

  if (input.internal) return

  // A public vendor reply hands the ball to the client; a client message reopens the thread.
  await tx
    .update(supportThreads)
    .set({ status: fromVendor ? 'waiting_on_client' : 'open', lastMessageAt: new Date() })
    .where(eq(supportThreads.id, threadId))

  const [author] = await tx
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, actor.userId))
  await notifySupportMessage(scope, {
    threadId,
    authorUserId: actor.userId,
    authorName: author?.name ?? actor.email,
    fromVendor,
    body: input.body,
  })
}
