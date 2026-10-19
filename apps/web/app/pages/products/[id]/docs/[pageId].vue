<script setup lang="ts">
import type { DocPage, DocPageSummary } from '@entitled/contracts/docs'

definePageMeta({ layout: 'client' })

const route = useRoute()
const productId = computed(() => String(route.params.id))
const pageId = computed(() => String(route.params.pageId))

const { data: pages } = await useFetch<DocPageSummary[]>(
  () => `/api/products/${productId.value}/docs`,
  { key: `docs-${productId.value}`, default: () => [] },
)
const { data: page, error } = await useFetch<DocPage>(() => `/api/docs/${pageId.value}`, {
  key: `doc-${pageId.value}`,
})

useSeoMeta({ title: () => page.value?.title ?? 'Documentation' })
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-[14rem_1fr]">
    <nav class="space-y-1" aria-label="Documentation pages">
      <UButton
        icon="i-lucide-arrow-left"
        variant="link"
        color="neutral"
        :to="`/products/${productId}`"
        label="Back to product"
        class="mb-2 px-0"
      />
      <ULink
        v-for="item in pages"
        :key="item.id"
        :to="`/products/${productId}/docs/${item.id}`"
        class="block rounded-md px-2 py-1 text-sm"
        active-class="bg-elevated font-medium text-highlighted"
      >
        {{ item.title }}
      </ULink>
    </nav>
    <article v-if="page" class="min-w-0 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold text-highlighted">{{ page.title }}</h1>
        <UButton
          :to="`/api/docs/${page.id}/export`"
          external
          icon="i-lucide-download"
          variant="ghost"
          color="neutral"
          label="Download .md"
        />
      </div>
      <MarkdownContent :html="page.bodyHtml" />
    </article>
    <UAlert v-else-if="error" color="warning" variant="subtle" title="Page not found" />
  </div>
</template>
