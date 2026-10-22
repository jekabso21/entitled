<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'
import type { DocPageSummary } from '@entitled/contracts/docs'
import type { Release } from '@entitled/contracts/releases'

definePageMeta({ layout: 'client' })

const route = useRoute()
const productId = computed(() => String(route.params.id))
const { data: product, error } = await useFetch<Product>(() => `/api/products/${productId.value}`, {
  key: `product-${productId.value}`,
})

const { data: releases } = await useFetch<Release[]>(
  () => `/api/products/${productId.value}/releases`,
  { key: `releases-${productId.value}`, default: () => [] },
)

const { data: docs } = await useFetch<DocPageSummary[]>(
  () => `/api/products/${productId.value}/docs`,
  { key: `docs-${productId.value}`, default: () => [] },
)

const docRows = computed(() => flattenDocTree(docs.value).filter((row) => row.depth < 2))
const latestRelease = computed(() => releases.value[0])
const earlierReleases = computed(() => releases.value.slice(1))

useSeoMeta({ title: () => product.value?.name ?? 'Product' })
</script>

<template>
  <div v-if="product" class="space-y-8">
    <PageHeader
      :title="product.name"
      :description="product.description"
      :breadcrumbs="[{ label: 'Products', to: '/' }, { label: product.name }]"
    >
      <template #actions>
        <UButton
          :to="{ path: '/support/new', query: { product: product.id } }"
          icon="i-lucide-life-buoy"
          color="neutral"
          variant="outline"
          label="Get support"
        />
      </template>
    </PageHeader>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
      <div class="min-w-0 space-y-8">
        <ReleaseCard
          v-if="latestRelease"
          :release="latestRelease"
          :revisions="product.revisions"
          is-latest
        />
        <UEmpty
          v-else
          icon="i-lucide-cpu"
          title="No releases yet"
          description="Published firmware for this product appears here."
          variant="outline"
          class="bg-default"
        />

        <section v-if="earlierReleases.length" class="space-y-3">
          <h2 class="text-lg font-semibold text-highlighted">Earlier releases</h2>
          <ul class="border border-default bg-default">
            <ReleaseHistoryItem
              v-for="release in earlierReleases"
              :key="release.id"
              :release="release"
              :revisions="product.revisions"
            />
          </ul>
        </section>
      </div>

      <aside class="space-y-6">
        <section class="border border-default bg-default">
          <h2 class="border-b border-default px-4 py-3 text-sm font-semibold text-highlighted">
            Documentation
          </h2>
          <ul v-if="docRows.length" class="p-1.5">
            <li v-for="row in docRows" :key="row.page.id">
              <NuxtLink
                :to="`/products/${productId}/docs/${row.page.id}`"
                class="flex min-h-9 items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm text-default transition-colors hover:bg-elevated hover:text-highlighted"
                :class="row.depth ? 'pl-8 text-muted' : ''"
              >
                <UIcon
                  v-if="!row.depth"
                  :name="row.hasChildren ? 'i-lucide-book-open' : 'i-lucide-file-text'"
                  class="size-4 shrink-0 text-dimmed"
                />
                <span class="min-w-0 flex-1 truncate">{{ row.page.title }}</span>
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="px-4 py-3 text-sm text-muted">No documentation published yet.</p>
        </section>

        <section v-if="product.revisions.length" class="border border-default bg-default">
          <h2 class="border-b border-default px-4 py-3 text-sm font-semibold text-highlighted">
            Hardware revisions
          </h2>
          <dl class="divide-y divide-default px-4">
            <div
              v-for="revision in product.revisions"
              :key="revision.id"
              class="flex items-center gap-3 py-2.5"
            >
              <dt><RevisionTag :code="revision.code" /></dt>
              <dd class="min-w-0 truncate text-sm text-default">{{ revision.name }}</dd>
            </div>
          </dl>
        </section>

        <section class="space-y-2 border border-default bg-default p-4">
          <h2 class="text-sm font-semibold text-highlighted">Need help?</h2>
          <p class="text-sm text-muted">
            Ask the support team about installing or using {{ product.name }}.
          </p>
          <UButton
            :to="{ path: '/support/new', query: { product: product.id } }"
            label="Open a support request"
            variant="link"
            trailing-icon="i-lucide-arrow-right"
            class="px-0"
          />
        </section>
      </aside>
    </div>
  </div>
  <UAlert
    v-else-if="error"
    color="warning"
    variant="subtle"
    icon="i-lucide-search-x"
    title="Product not found"
    description="It may have been removed, or your account no longer has access to it."
    :actions="[{ label: 'All products', to: '/', color: 'neutral', variant: 'outline' }]"
  />
</template>
