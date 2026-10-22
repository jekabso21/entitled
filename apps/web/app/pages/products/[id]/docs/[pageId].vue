<script setup lang="ts">
import type { DocPage, DocPageSummary } from '@entitled/contracts/docs'
import type { Product } from '@entitled/contracts/products'

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
const { data: product } = await useFetch<Product>(() => `/api/products/${productId.value}`, {
  key: `product-${productId.value}`,
})

const rows = computed(() => flattenDocTree(pages.value))
const pageItems = computed(() =>
  rows.value.map((row) => ({
    label: `${'\u2003'.repeat(row.depth)}${row.page.title}`,
    value: row.page.id,
  })),
)
const currentIndex = computed(() => rows.value.findIndex((row) => row.page.id === pageId.value))
const previousPage = computed(() => rows.value[currentIndex.value - 1]?.page)
const nextPage = computed(() =>
  currentIndex.value >= 0 ? rows.value[currentIndex.value + 1]?.page : undefined,
)
const trail = computed(() => {
  const byId = new Map(pages.value.map((item) => [item.id, item]))
  const parents = []
  let parentId = page.value?.parentId ?? null
  while (parentId) {
    const parent = byId.get(parentId)
    if (!parent) break
    parents.unshift({ label: parent.title, to: `/products/${productId.value}/docs/${parent.id}` })
    parentId = parent.parentId
  }
  return parents
})
const selectedPageId = computed({
  get: () => pageId.value,
  set: (id: string) => void navigateTo(`/products/${productId.value}/docs/${id}`),
})

useSeoMeta({ title: () => page.value?.title ?? 'Documentation' })
</script>

<template>
  <div class="space-y-6">
    <UBreadcrumb
      :items="[
        { label: 'Products', to: '/' },
        { label: product?.name ?? 'Product', to: `/products/${productId}` },
        ...trail,
        { label: page?.title ?? 'Documentation' },
      ]"
    />
    <div
      class="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[15rem_minmax(0,1fr)_13rem]"
    >
      <nav aria-label="Documentation pages" class="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <DocSearch
          :product-id="productId"
          :page-path="(id: string) => `/products/${productId}/docs/${id}`"
        />
        <USelect
          v-model="selectedPageId"
          :items="pageItems"
          aria-label="Documentation page"
          class="w-full lg:hidden"
        />
        <p class="mb-2 hidden px-3 text-xs font-medium text-dimmed lg:block">Documentation</p>
        <ul class="hidden space-y-0.5 lg:block">
          <li v-for="row in rows" :key="row.page.id">
            <NuxtLink
              :to="`/products/${productId}/docs/${row.page.id}`"
              class="block rounded-sm border-l-2 border-transparent py-1.5 pr-3 text-sm transition-colors hover:bg-default hover:text-highlighted"
              :class="
                row.depth === 0 && row.hasChildren ? 'font-medium text-default' : 'text-muted'
              "
              :style="{ paddingLeft: `${String(0.75 + row.depth * 0.875)}rem` }"
              active-class="!border-primary bg-primary/10 font-medium !text-primary"
            >
              {{ row.page.title }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <article v-if="page" class="min-w-0 border border-default bg-default p-5 sm:p-8">
        <header
          class="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-default pb-5"
        >
          <div class="min-w-0 space-y-1.5">
            <h1 class="text-2xl font-semibold tracking-tight text-highlighted sm:text-[28px]">
              {{ page.title }}
            </h1>
            <p v-if="page.description" class="text-muted">{{ page.description }}</p>
            <p class="text-xs text-dimmed">Updated {{ formatDate(page.updatedAt) }}</p>
          </div>
          <UButton
            :to="`/api/docs/${page.id}/export`"
            external
            icon="i-lucide-download"
            variant="outline"
            color="neutral"
            size="sm"
            label="Download .md"
          />
        </header>
        <div class="max-w-[72ch]"><MarkdownContent :html="page.bodyHtml" /></div>
        <nav
          v-if="previousPage || nextPage"
          aria-label="Previous and next page"
          class="mt-10 grid gap-3 border-t border-default pt-6 sm:grid-cols-2"
        >
          <NuxtLink
            v-if="previousPage"
            :to="`/products/${productId}/docs/${previousPage.id}`"
            class="group border border-default p-4 transition-colors hover:border-accented"
          >
            <span class="flex items-center gap-1 text-xs text-dimmed">
              <UIcon name="i-lucide-arrow-left" class="size-3.5" /> Previous
            </span>
            <span class="mt-1 block font-medium text-highlighted">{{ previousPage.title }}</span>
          </NuxtLink>
          <span v-else />
          <NuxtLink
            v-if="nextPage"
            :to="`/products/${productId}/docs/${nextPage.id}`"
            class="group border border-default p-4 text-right transition-colors hover:border-accented"
          >
            <span class="flex items-center justify-end gap-1 text-xs text-dimmed">
              Next <UIcon name="i-lucide-arrow-right" class="size-3.5" />
            </span>
            <span class="mt-1 block font-medium text-highlighted">{{ nextPage.title }}</span>
          </NuxtLink>
        </nav>
      </article>
      <UAlert v-else-if="error" color="warning" variant="subtle" title="Page not found" />
      <aside v-if="page" class="hidden xl:sticky xl:top-20 xl:block xl:self-start">
        <DocToc :headings="page.headings" />
      </aside>
    </div>
  </div>
</template>
