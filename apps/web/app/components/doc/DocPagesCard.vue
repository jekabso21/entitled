<script setup lang="ts">
import type { DocPage, DocPageSummary } from '@entitled/contracts/docs'

const { productId, canEdit } = defineProps<{ productId: string; canEdit: boolean }>()

const { data: pages } = await useFetch<DocPageSummary[]>(() => `/api/products/${productId}/docs`, {
  key: `docs-${productId}`,
  default: () => [],
})
const toast = useToast()
const importInput = useTemplateRef<HTMLInputElement>('importInput')

async function createPage() {
  const page = await $fetch<DocPage>(`/api/products/${productId}/docs`, {
    method: 'POST',
    body: { title: 'Untitled page' },
  })
  await navigateTo(`/admin/docs/${page.id}`)
}

async function importFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const page = await $fetch<DocPage>(`/api/products/${productId}/docs/import`, {
      method: 'POST',
      body: { fileName: file.name, markdown: await file.text() },
    })
    await navigateTo(`/admin/docs/${page.id}`)
  } catch (error) {
    toast.add({ title: apiErrorMessage(error, 'Import failed'), color: 'error' })
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-semibold text-highlighted">Documentation</h2>
        <div v-if="canEdit" class="flex gap-2">
          <input
            ref="importInput"
            type="file"
            accept=".md,.markdown,text/markdown"
            class="hidden"
            @change="importFile"
          />
          <UButton
            icon="i-lucide-file-up"
            variant="ghost"
            color="neutral"
            label="Import .md"
            @click="importInput?.click()"
          />
          <UButton icon="i-lucide-plus" variant="soft" label="New page" @click="createPage" />
        </div>
      </div>
    </template>
    <ul v-if="pages.length" class="divide-y divide-default">
      <li v-for="page in pages" :key="page.id" class="flex items-center justify-between gap-3 py-2">
        <ULink :to="`/admin/docs/${page.id}`" class="font-medium text-highlighted">{{
          page.title
        }}</ULink>
        <UBadge
          variant="subtle"
          :color="page.status === 'published' ? 'success' : 'warning'"
          :label="page.status"
        />
      </li>
    </ul>
    <p v-else class="text-sm text-muted">No pages yet.</p>
  </UCard>
</template>
