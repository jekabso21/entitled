<script setup lang="ts">
import type { DocPageSummary } from '@entitled/contracts/docs'

const { productId, canEdit } = defineProps<{ productId: string; canEdit: boolean }>()

const { data: pages } = await useFetch<DocPageSummary[]>(() => `/api/products/${productId}/docs`, {
  key: `docs-${productId}`,
  default: () => [],
})
const rows = computed(() =>
  flattenDocTree(pages.value)
    .filter((row) => row.depth < 2)
    .slice(0, 8),
)
const publishedCount = computed(
  () => pages.value.filter((page) => page.status === 'published').length,
)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="font-semibold text-highlighted">Documentation</h2>
          <p class="text-sm text-muted">
            {{ pages.length }} pages, {{ publishedCount }} published. Clients see published pages.
          </p>
        </div>
        <UButton
          :to="`/admin/docs/${productId}`"
          :icon="canEdit ? 'i-lucide-pencil' : 'i-lucide-book-open'"
          :label="canEdit ? 'Open editor' : 'View'"
          variant="soft"
        />
      </div>
    </template>
    <ul v-if="rows.length" class="divide-y divide-default">
      <li
        v-for="row in rows"
        :key="row.page.id"
        class="flex items-center justify-between gap-3 py-2"
        :style="{ paddingLeft: `${String(row.depth * 1.25)}rem` }"
      >
        <ULink :to="`/admin/docs/${productId}/${row.page.id}`" class="truncate text-highlighted">
          {{ row.page.title }}
        </ULink>
        <StatusBadge
          :color="row.page.status === 'published' ? 'success' : 'warning'"
          :label="row.page.status"
        />
      </li>
    </ul>
    <p v-else class="text-sm text-muted">No pages yet. Open the editor to write or import some.</p>
  </UCard>
</template>
