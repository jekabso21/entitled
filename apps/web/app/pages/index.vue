<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'

definePageMeta({ layout: 'client' })

const { data: user } = useCurrentUser()
const { data: products } = await useFetch<Product[]>('/api/products', {
  key: 'products',
  default: () => [],
})
const accountNames = computed(
  () => user.value?.memberships.map((membership) => membership.clientAccountName).join(', ') ?? '',
)

useSeoMeta({ title: 'Products' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">Your products</h1>
      <p class="text-muted">{{ accountNames }}</p>
    </div>
    <div v-if="products.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
    <UEmpty
      v-else
      icon="i-lucide-package"
      title="No products yet"
      description="Firmware releases and documentation appear here once your vendor grants access."
    />
  </div>
</template>
