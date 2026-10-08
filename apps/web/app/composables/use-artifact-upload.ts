import type { ArtifactUpload } from '@entitled/contracts/releases'

function putWithProgress(upload: ArtifactUpload, file: File, onProgress: (ratio: number) => void) {
  // fetch() cannot report upload progress, so the PUT uses XMLHttpRequest.
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', upload.uploadUrl)
    for (const [name, value] of Object.entries(upload.uploadHeaders)) {
      request.setRequestHeader(name, value)
    }
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total)
    }
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve()
      else reject(new Error(`Upload failed with status ${String(request.status)}`))
    }
    request.onerror = () => {
      reject(new Error('Upload failed: network error'))
    }
    request.send(file)
  })
}

export function useArtifactUpload() {
  const progress = ref(0)
  const uploading = ref(false)

  async function upload(releaseId: string, file: File) {
    uploading.value = true
    progress.value = 0
    try {
      const started = await $fetch<ArtifactUpload>(`/api/releases/${releaseId}/artifacts`, {
        method: 'POST',
        body: {
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        },
      })
      await putWithProgress(started, file, (ratio) => {
        progress.value = ratio
      })
      await $fetch(`/api/artifacts/${started.artifact.id}/complete`, { method: 'POST' })
    } finally {
      uploading.value = false
    }
  }

  return { upload, progress, uploading }
}
