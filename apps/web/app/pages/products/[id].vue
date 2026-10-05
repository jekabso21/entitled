<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'

definePageMeta({ layout: 'client' })

const route = useRoute()
const productId = computed(() => String(route.params.id))
const { data: product, error } = await useFetch<Product>(() => `/api/products/${productId.value}`, {
  key: `product-${productId.value}`,
})

useSeoMeta({ title: () => product.value?.name ?? 'Product' })
</script>

<template>
  <div class="space-y-6">
    <UButton
      icon="i-lucide-arrow-left"
      variant="link"
      color="neutral"
      to="/"
      label="All products"
    />
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
      <UEmpty
        icon="i-lucide-cpu"
        title="No releases yet"
        description="Published firmware appears here."
      />
    </template>
    <UAlert v-else-if="error" color="warning" variant="subtle" title="Product not found" />
  </div>
</template>
