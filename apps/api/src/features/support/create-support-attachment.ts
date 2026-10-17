import type {
  CreateSupportAttachmentInput,
  SupportAttachmentUpload,
} from '@entitled/contracts/support'
import { supportAttachments } from '@entitled/db/schema'
import type { Actor } from '#lib/actor.ts'
import type { Db } from '@entitled/db'
import { presignUpload, supportAttachmentStorageKey } from '#lib/object-storage.ts'

export async function createSupportAttachment(
  db: Db,
  actor: Actor,
  input: CreateSupportAttachmentInput,
): Promise<SupportAttachmentUpload> {
  const id = crypto.randomUUID()
  const storageKey = supportAttachmentStorageKey(id, input.fileName)
  await db.insert(supportAttachments).values({
    id,
    uploadedByUserId: actor.userId,
    fileName: input.fileName,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    storageKey,
  })
  const upload = await presignUpload(storageKey, input.contentType, input.sizeBytes)
  return { attachmentId: id, uploadUrl: upload.url, uploadHeaders: upload.headers }
}
