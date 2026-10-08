<script setup lang="ts">
import type { Artifact, Release } from '@entitled/contracts/releases'
import type { TableColumn } from '@nuxt/ui'

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

const columns: TableColumn<Artifact>[] = [
  { accessorKey: 'fileName', header: 'File' },
  { id: 'size', header: 'Size', cell: ({ row }) => formatBytes(row.original.sizeBytes) },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'sha256', header: 'SHA-256' },
  { id: 'actions', header: '' },
]

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  for (const file of input.files ?? []) {
    try {
      await upload(release.id, file)
      toast.add({ title: `${file.name} uploaded; computing checksum`, color: 'success' })
    } catch (error) {
      toast.add({ title: apiErrorMessage(error, `Upload of ${file.name} failed`), color: 'error' })
    }
    emit('changed')
  }
  input.value = ''
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
    <div class="flex items-center justify-between gap-4">
      <h2 class="font-semibold text-highlighted">Files</h2>
      <template v-if="canUpload">
        <input ref="fileInput" type="file" multiple class="hidden" @change="onFilesSelected" />
        <UButton
          icon="i-lucide-upload"
          label="Upload files"
          variant="soft"
          :loading="uploading"
          @click="fileInput?.click()"
        />
      </template>
    </div>
    <UProgress v-if="uploading" :model-value="Math.round(progress * 100)" />
    <UTable :data="release.artifacts" :columns="columns" empty="No files yet">
      <template #status-cell="{ row }">
        <UBadge
          variant="subtle"
          :color="statusColor[row.original.status]"
          :label="row.original.status"
        />
      </template>
      <template #sha256-cell="{ row }">
        <code v-if="row.original.sha256" class="text-xs" :title="row.original.sha256">
          {{ row.original.sha256.slice(0, 16) }}…
        </code>
        <span v-else class="text-muted">—</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end">
          <UButton
            v-if="canDelete"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            :aria-label="`Remove ${row.original.fileName}`"
            @click="remove(row.original)"
          />
        </div>
      </template>
    </UTable>
  </div>
</template>
