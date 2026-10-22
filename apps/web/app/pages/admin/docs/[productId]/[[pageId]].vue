<script setup lang="ts">
import type { DocPageSummary } from '@entitled/contracts/docs'
import type { Product } from '@entitled/contracts/products'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const productId = computed(() => String(route.params.productId))
const pageId = computed(() => (route.params.pageId ? String(route.params.pageId) : null))
const isTreeOpen = ref(false)

const { data: product } = await useFetch<Product>(() => `/api/products/${productId.value}`, {
  key: `product-${productId.value}`,
})
const { data: pages, refresh } = await useFetch<DocPageSummary[]>(
  () => `/api/products/${productId.value}/docs`,
  { key: `docs-${productId.value}`, default: () => [] },
)

const rows = computed(() => flattenDocTree(pages.value))
const activeRow = computed(() => rows.value.find((row) => row.page.id === pageId.value))
const subPageCount = computed(() =>
  pageId.value ? descendantIds(pages.value, pageId.value).size : 0,
)
const publishedCount = computed(
  () => pages.value.filter((page) => page.status === 'published').length,
)

watch(pageId, () => (isTreeOpen.value = false))

async function onDeleted() {
  await refresh()
  await navigateTo(`/admin/docs/${productId.value}`)
}

useSeoMeta({
  title: () => `${activeRow.value?.page.title ?? 'Documentation'} · ${product.value?.name ?? ''}`,
})
</script>

<template>
  <UDashboardPanel id="docs-workspace" :ui="{ body: 'p-0 sm:p-0 lg:p-0 gap-0' }">
    <template #header>
      <UDashboardNavbar :title="product ? `${product.name} documentation` : 'Documentation'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            to="/admin/docs"
            aria-label="All documentation"
          />
        </template>
        <template #right>
          <span class="hidden text-sm text-muted sm:inline">
            {{ pages.length }} pages · {{ publishedCount }} published
          </span>
          <UButton
            :to="`/admin/docs/${productId}/files`"
            icon="i-lucide-folder-open"
            color="neutral"
            variant="ghost"
            label="Files"
          />
          <UButton
            v-if="product"
            :to="
              activeRow?.page.status === 'published'
                ? `/products/${product.id}/docs/${activeRow.page.id}`
                : `/products/${product.id}`
            "
            target="_blank"
            icon="i-lucide-external-link"
            color="neutral"
            variant="ghost"
            label="View as client"
            class="hidden md:inline-flex"
          />
          <USlideover v-model:open="isTreeOpen" side="left" title="Pages" class="lg:hidden">
            <UButton icon="i-lucide-panel-left" color="neutral" variant="outline" label="Pages" />
            <template #body>
              <DocTree
                :product-id="productId"
                :pages="pages"
                :active-id="pageId"
                @changed="refresh"
              />
            </template>
          </USlideover>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="flex min-h-0 flex-1">
        <aside class="hidden w-72 shrink-0 border-r border-default bg-default lg:flex lg:flex-col">
          <DocTree :product-id="productId" :pages="pages" :active-id="pageId" @changed="refresh" />
        </aside>
        <DocPageEditor
          v-if="pageId && activeRow"
          :key="pageId"
          :page-id="pageId"
          :product-id="productId"
          :depth="activeRow.depth"
          :sub-page-count="subPageCount"
          :pages="pages"
          @changed="refresh"
          @deleted="onDeleted"
        />
        <div v-else class="flex flex-1 items-start justify-center overflow-y-auto p-6 sm:p-10">
          <div class="w-full max-w-2xl space-y-6">
            <div>
              <h2 class="text-xl font-semibold text-highlighted">
                {{ pages.length ? 'Choose a page to edit' : 'Start the documentation' }}
              </h2>
              <p class="mt-1 text-muted">
                Pages can have sub-pages, so you can build sections like “Getting started” with
                pages inside. Clients see published pages on the product page.
              </p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-3 border border-default bg-default p-5">
                <UIcon name="i-lucide-file-plus" class="size-6 text-primary" />
                <h3 class="font-semibold text-highlighted">Write a page</h3>
                <p class="text-sm text-muted">
                  Use the editor with headings, tables, images, videos and file attachments.
                </p>
              </div>
              <div class="space-y-3 border border-default bg-default p-5">
                <UIcon name="i-lucide-file-up" class="size-6 text-primary" />
                <h3 class="font-semibold text-highlighted">Import a document</h3>
                <p class="text-sm text-muted">
                  Bring in a Markdown file, a .zip with images, or a PDF manual. Its headings become
                  pages.
                </p>
              </div>
            </div>
            <p class="text-sm text-dimmed">Use “New page” or “Import” in the page list to begin.</p>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
