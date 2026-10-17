import { supportAttachments } from '@entitled/db/schema'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { DomainError } from '#lib/domain-error.ts'
import { storedObjectSize } from '#lib/object-storage.ts'
import type { TransactionScope } from '#lib/transaction.ts'

// Only the uploader can attach a file, only once, and only after its bytes have arrived.
export async function linkAttachments(
  tx: TransactionScope['tx'],
  actor: Actor,
  messageId: string,
  attachmentIds: readonly string[],
) {
  if (attachmentIds.length === 0) return
  const ids = [...new Set(attachmentIds)]
  const rows = await tx
    .select()
    .from(supportAttachments)
    .where(
      and(
        inArray(supportAttachments.id, ids),
        eq(supportAttachments.uploadedByUserId, actor.userId),
        isNull(supportAttachments.messageId),
      ),
    )
  if (rows.length !== ids.length) throw new DomainError('invalid_state', 'Unknown attachment')

  for (const row of rows) {
    if ((await storedObjectSize(row.storageKey)) !== row.sizeBytes) {
      throw new DomainError('invalid_state', `${row.fileName} has not finished uploading`)
    }
  }
  await tx.update(supportAttachments).set({ messageId }).where(inArray(supportAttachments.id, ids))
}
