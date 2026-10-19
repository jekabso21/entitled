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

useSeoMeta({ title: () => product.value?.name ?? 'Product' })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <UButton
        icon="i-lucide-arrow-left"
        variant="link"
        color="neutral"
        to="/"
        label="All products"
      />
      <UButton
        v-if="product"
        :to="{ path: '/support/new', query: { product: product.id } }"
        icon="i-lucide-life-buoy"
        variant="soft"
        label="Get support"
      />
    </div>
    <template v-if="product">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold text-highlighted">{{ product.name }}</h1>
        <p v-if="product.description" class="text-muted">{{ product.description }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="revision in product.revisions"
          :key="revision.id"
          variant="subtle"
          :label="`Rev ${revision.code} · ${revision.name}`"
        />
      </div>
      <UCard v-if="docs.length">
        <template #header>
          <h2 class="font-semibold text-highlighted">Documentation</h2>
        </template>
        <ul class="grid gap-1 sm:grid-cols-2">
          <li v-for="doc in docs" :key="doc.id">
            <ULink
              :to="`/products/${productId}/docs/${doc.id}`"
              class="flex items-center gap-2 text-sm"
            >
              <UIcon name="i-lucide-file-text" class="size-4 text-muted" />
              {{ doc.title }}
            </ULink>
          </li>
        </ul>
      </UCard>
      <div v-if="releases.length" class="space-y-4">
        <ReleaseCard v-for="release in releases" :key="release.id" :release="release" />
      </div>
      <UEmpty
        v-else
        icon="i-lucide-cpu"
        title="No releases yet"
        description="Published firmware appears here."
      />
    </template>
    <UAlert v-else-if="error" color="warning" variant="subtle" title="Product not found" />
  </div>
</template>
