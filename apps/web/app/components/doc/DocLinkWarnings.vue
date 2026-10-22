<script setup lang="ts">
import type { DocPageSummary } from '@entitled/contracts/docs'
import { findDocPageLinks } from '@entitled/markdown/doc-page-links'

const { body, pages, productId } = defineProps<{
  body: string
  pages: readonly DocPageSummary[]
  productId: string
}>()

// Only links within this product can be checked; the page list holds no other product.
const problems = computed(() => {
  const byId = new Map(pages.map((page) => [page.id, page]))
  return findDocPageLinks(body)
    .filter((link) => link.productId === productId)
    .flatMap((link) => {
      const target = byId.get(link.pageId)
      if (!target) return [{ text: link.text, reason: 'points to a page that was deleted' }]
      if (target.status === 'draft') {
        return [{ text: link.text, reason: `points to “${target.title}”, which is a draft` }]
      }
      return []
    })
})
</script>

<template>
  <UAlert
    v-if="problems.length"
    color="warning"
    variant="subtle"
    icon="i-lucide-link-2-off"
    :title="
      problems.length === 1 ? '1 link needs attention' : `${problems.length} links need attention`
    "
    class="mb-6"
  >
    <template #description>
      <ul class="mt-1 list-disc space-y-0.5 pl-4">
        <li v-for="(problem, index) in problems" :key="index">
          “{{ problem.text || 'Untitled link' }}” {{ problem.reason }}.
        </li>
      </ul>
    </template>
  </UAlert>
</template>
