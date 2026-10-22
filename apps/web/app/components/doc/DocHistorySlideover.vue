<script setup lang="ts">
import type { DocPageRevision, DocPageRevisionSummary } from '@entitled/contracts/docs'
import { diffLines } from '@entitled/markdown/line-diff'

const { pageId, current, canRestore } = defineProps<{
  pageId: string
  current: { title: string; body: string }
  canRestore: boolean
}>()
const emit = defineEmits<{ restored: [] }>()
const isOpen = defineModel<boolean>('open', { required: true })

const toast = useToast()
const { data: revisions, refresh } = await useFetch<DocPageRevisionSummary[]>(
  () => `/api/docs/${pageId}/revisions`,
  { key: `doc-revisions-${pageId}`, default: () => [], immediate: false, watch: false },
)
watch(isOpen, (open) => {
  if (open) void refresh()
})

const selectedId = ref<string | null>(null)
watch(revisions, (list) => {
  selectedId.value = list[1]?.id ?? list[0]?.id ?? null
})
const { data: selected } = await useFetch<DocPageRevision>(
  () => `/api/docs/${pageId}/revisions/${selectedId.value ?? ''}`,
  { key: `doc-revision-${pageId}`, immediate: false, watch: [selectedId] },
)

// Long unchanged stretches fold away, keeping a few lines of context around each change.
const CONTEXT = 3
const rows = computed(() => {
  if (!selected.value) return []
  const lines = diffLines(selected.value.body, current.body)
  const near = (index: number) =>
    lines
      .slice(Math.max(0, index - CONTEXT), index + CONTEXT + 1)
      .some((line) => line.kind !== 'same')
  const out: (
    { kind: 'same' | 'added' | 'removed'; text: string } | { kind: 'gap'; count: number }
  )[] = []
  for (const [index, line] of lines.entries()) {
    if (line.kind !== 'same' || near(index)) out.push(line)
    else {
      const last = out.at(-1)
      if (last?.kind === 'gap') last.count++
      else out.push({ kind: 'gap', count: 1 })
    }
  }
  return out
})
const isUnchanged = computed(
  () => selected.value?.body === current.body && selected.value.title === current.title,
)

const restoring = ref(false)
async function restore() {
  if (!selected.value) return
  restoring.value = true
  try {
    await $fetch(`/api/docs/${pageId}/revisions/${selected.value.id}/restore`, { method: 'POST' })
    toast.add({ title: 'Version restored', color: 'success' })
    isOpen.value = false
    emit('restored')
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    restoring.value = false
  }
}

const lineClass = {
  added: 'bg-success/10 text-success',
  removed: 'bg-error/10 text-error line-through decoration-error/40',
  same: 'text-muted',
}
const lineSign = { added: '+', removed: '−', same: ' ' }
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    title="Page history"
    description="Every save keeps a version. Compare one with the saved page, or bring it back."
    :ui="{ content: 'sm:max-w-4xl' }"
  >
    <template #body>
      <div class="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
        <ul class="space-y-1" aria-label="Versions">
          <li v-for="(revision, index) in revisions" :key="revision.id">
            <button
              type="button"
              class="w-full border px-3 py-2 text-left text-sm transition-colors"
              :class="
                revision.id === selectedId
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:bg-elevated'
              "
              :aria-pressed="revision.id === selectedId"
              @click="selectedId = revision.id"
            >
              <span class="block font-medium text-highlighted">
                {{ formatDateTime(revision.createdAt) }}
              </span>
              <span class="block text-xs text-muted">
                {{ revision.createdByName ?? 'Unknown' }}
                <template v-if="index === 0"> · current</template>
              </span>
            </button>
          </li>
        </ul>

        <div v-if="selected" class="min-w-0 space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-sm text-muted">
              Changes from this version to the saved page.
              <span v-if="selected.title !== current.title">
                Title was “{{ selected.title }}”.
              </span>
            </p>
            <UButton
              v-if="canRestore"
              class="ml-auto"
              icon="i-lucide-history"
              label="Restore this version"
              :disabled="isUnchanged"
              :loading="restoring"
              @click="restore"
            />
          </div>
          <p v-if="isUnchanged" class="text-sm text-dimmed">Same as the saved page.</p>
          <pre
            v-else
            class="overflow-x-auto border border-default bg-muted py-2 font-mono text-xs leading-5"
          ><template v-for="(row, index) in rows" :key="index"><span
            v-if="row.kind === 'gap'"
            class="block px-3 text-dimmed italic"
          >… {{ row.count }} unchanged {{ row.count === 1 ? 'line' : 'lines' }}</span><span
            v-else
            class="block px-3 whitespace-pre-wrap"
            :class="lineClass[row.kind]"
          >{{ lineSign[row.kind] }} {{ row.text }}</span></template></pre>
        </div>
      </div>
    </template>
  </USlideover>
</template>
