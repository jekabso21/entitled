<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'

definePageMeta({ layout: 'client' })

const { data: user } = useCurrentUser()
const { data: products } = await useFetch<Product[]>('/api/products', {
  key: 'products',
  default: () => [],
})
const query = ref('')

const accountNames = computed(
  () => user.value?.memberships.map((membership) => membership.clientAccountName).join(', ') ?? '',
)
const visibleProducts = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return products.value
  return products.value.filter((product) =>
    `${product.name} ${product.description}`.toLowerCase().includes(needle),
  )
})

useSeoMeta({ title: 'Products' })
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Your products"
      :description="
        accountNames
          ? `Firmware, documentation and support for ${accountNames}.`
          : 'Firmware, documentation and support for your products.'
      "
    />
    <div v-if="products.length > 6" class="flex flex-wrap items-center justify-between gap-3">
      <UInput
        v-model="query"
        icon="i-lucide-search"
        placeholder="Search products"
        aria-label="Search products"
        class="w-full sm:w-72"
      />
      <p class="text-sm text-dimmed">
        {{ visibleProducts.length }} of {{ products.length }} products
      </p>
    </div>
    <div v-if="visibleProducts.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProductCard v-for="product in visibleProducts" :key="product.id" :product="product" />
    </div>
    <UEmpty
      v-else-if="products.length"
      icon="i-lucide-search-x"
      title="No matching products"
      :description="`Nothing matches “${query}”. Check the spelling or clear the search.`"
      :actions="[
        {
          label: 'Clear search',
          color: 'neutral',
          variant: 'outline',
          onClick: () => (query = ''),
        },
      ]"
      variant="outline"
      class="bg-default"
    />
    <UEmpty
      v-else
      icon="i-lucide-package"
      title="No products yet"
      description="Firmware releases and documentation appear here once your vendor grants access."
      variant="outline"
      class="bg-default"
    />
  </div>
</template>
