import type { SupportAttachmentUpload } from '@entitled/contracts/support'

export type PendingAttachment = { id: string; fileName: string }

// Files upload straight to storage as soon as they are picked; the message sends only their ids.
export function useSupportAttachments() {
  const attachments = ref<PendingAttachment[]>([])
  const uploading = ref(false)

  async function add(files: Iterable<File>) {
    uploading.value = true
    try {
      for (const file of files) {
        const upload = await $fetch<SupportAttachmentUpload>('/api/support/attachments', {
          method: 'POST',
          body: {
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          },
        })
        const res = await fetch(upload.uploadUrl, {
          method: 'PUT',
          headers: upload.uploadHeaders,
          body: file,
        })
        if (!res.ok) throw new Error(`Upload of ${file.name} failed`)
        attachments.value.push({ id: upload.attachmentId, fileName: file.name })
      }
    } finally {
      uploading.value = false
    }
  }

  function remove(id: string) {
    attachments.value = attachments.value.filter((attachment) => attachment.id !== id)
  }

  function clear() {
    attachments.value = []
  }

  return { attachments, uploading, add, remove, clear }
}
