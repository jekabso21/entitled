import type { Queryable } from '@entitled/db'
import type { Actor } from '#lib/actor.ts'
import { DomainError } from '#lib/domain-error.ts'
import { presignDownload } from '#lib/object-storage.ts'
import { canSeeThread, loadSupportScope } from './support-access.ts'

export async function resolveSupportAttachmentDownload(
  db: Queryable,
  actor: Actor,
  attachmentId: string,
) {
  const attachment = await db.query.supportAttachments.findFirst({
    where: { id: attachmentId },
    with: { message: { with: { thread: true } } },
  })
  const message = attachment?.message
  const access = await loadSupportScope(db, actor)
  if (
    !attachment ||
    !message?.thread ||
    !canSeeThread(access, message.thread) ||
    (message.internal && access.kind === 'client')
  ) {
    throw new DomainError('not_found', 'Attachment not found')
  }
  return presignDownload(attachment.storageKey, attachment.fileName)
}
