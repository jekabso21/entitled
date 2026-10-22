<script setup lang="ts">
import type { Artifact, Release } from '@entitled/contracts/releases'

const { release } = defineProps<{ release: Release }>()
const emit = defineEmits<{ changed: [] }>()

const toast = useToast()
const { upload, progress, uploading } = useArtifactUpload()
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const canUpload = computed(() => release.status !== 'archived')
const canDelete = computed(() => release.status === 'draft')

const statusColor = {
  pending: 'neutral',
  processing: 'info',
  ready: 'success',
  failed: 'error',
} as const

const isDragging = ref(false)

async function uploadFiles(files: readonly File[]) {
  for (const file of files) {
    try {
      await upload(release.id, file)
      toast.add({ title: `${file.name} uploaded; computing checksum`, color: 'success' })
    } catch (error) {
      toast.add({ title: apiErrorMessage(error, `Upload of ${file.name} failed`), color: 'error' })
    }
    emit('changed')
  }
}

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  await uploadFiles([...(input.files ?? [])])
  input.value = ''
}

async function onDrop(event: DragEvent) {
  isDragging.value = false
  if (!canUpload.value || uploading.value) return
  await uploadFiles([...(event.dataTransfer?.files ?? [])])
}

async function remove(artifact: Artifact) {
  try {
    await $fetch(`/api/artifacts/${artifact.id}`, { method: 'DELETE' })
    emit('changed')
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="font-semibold text-highlighted">Files</h2>
      <p class="text-sm text-muted">
        Firmware images, signature files, PDFs … Clients download them from the release page.
      </p>
    </div>
    <ul v-if="release.artifacts.length" class="divide-y divide-default border border-default">
      <li
        v-for="artifact in release.artifacts"
        :key="artifact.id"
        class="flex items-start gap-3 px-3 py-2.5"
      >
        <UIcon :name="artifactIcon(artifact.fileName)" class="mt-0.5 size-5 shrink-0 text-muted" />
        <div class="min-w-0 flex-1 space-y-1">
          <p class="truncate font-mono text-[13px] font-medium text-highlighted">
            {{ artifact.fileName }}
          </p>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="font-mono text-xs text-dimmed">{{ formatBytes(artifact.sizeBytes) }}</span>
            <StatusBadge :color="statusColor[artifact.status]" :label="artifact.status" />
          </div>
          <ArtifactChecksum v-if="artifact.sha256" :value="artifact.sha256" />
        </div>
        <UButton
          v-if="canDelete"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="`Remove ${artifact.fileName}`"
          @click="remove(artifact)"
        />
      </li>
    </ul>
    <template v-if="canUpload">
      <input ref="fileInput" type="file" multiple class="hidden" @change="onFilesSelected" />
      <button
        type="button"
        class="flex min-h-32 w-full flex-col items-center justify-center gap-1.5 border border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="
          isDragging
            ? 'border-solid border-primary bg-primary/10'
            : 'border-accented hover:bg-muted'
        "
        :disabled="uploading"
        @click="fileInput?.click()"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
      >
        <UIcon name="i-lucide-upload" class="size-5 text-muted" />
        <span class="text-sm font-medium text-highlighted">
          {{ uploading ? 'Uploading…' : 'Upload files' }}
        </span>
        <span class="text-xs text-dimmed">Drop firmware images here or click to choose</span>
      </button>
      <UProgress v-if="uploading" :model-value="Math.round(progress * 100)" />
    </template>
    <p v-else-if="!release.artifacts.length" class="text-sm text-muted">No files.</p>
  </div>
</template>
