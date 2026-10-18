import type { DocAssetUpload } from '@entitled/contracts/docs'

export function useDocAssetUpload(productId: () => string) {
  const uploading = ref(false)

  async function upload(file: File) {
    uploading.value = true
    try {
      const asset = await $fetch<DocAssetUpload>(`/api/products/${productId()}/doc-assets`, {
        method: 'POST',
        body: {
          // Storage keys and Markdown URLs only allow a safe character set.
          fileName: file.name.replace(/[^\w.-]+/g, '-'),
          contentType: file.type,
          sizeBytes: file.size,
        },
      })
      const res = await fetch(asset.uploadUrl, {
        method: 'PUT',
        headers: asset.uploadHeaders,
        body: file,
      })
      if (!res.ok) throw new Error(`Upload of ${file.name} failed`)
      return asset.url
    } finally {
      uploading.value = false
    }
  }

  return { upload, uploading }
}
