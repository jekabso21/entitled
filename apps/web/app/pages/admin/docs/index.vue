<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'

definePageMeta({ layout: 'dashboard' })

const { data: products } = await useFetch<Product[]>('/api/products', {
  key: 'products',
  default: () => [],
})

useSeoMeta({ title: 'Documentation' })
</script>

<template>
  <UDashboardPanel id="docs">
    <template #header>
      <UDashboardNavbar title="Documentation">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <p class="text-muted">
        Each product has its own documentation. Choose one to write pages or import manuals.
      </p>
      <ul v-if="products.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="product in products" :key="product.id">
          <NuxtLink
            :to="`/admin/docs/${product.id}`"
            class="group flex h-full items-start gap-4 border border-default bg-default p-5 transition-colors hover:border-accented"
          >
            <span class="flex size-10 shrink-0 items-center justify-center bg-elevated text-muted">
              <UIcon name="i-lucide-book-open" class="size-5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block font-medium text-highlighted">{{ product.name }}</span>
              <span class="line-clamp-2 text-sm text-muted">{{
                product.description || 'Open the documentation editor'
              }}</span>
            </span>
            <UIcon
              name="i-lucide-chevron-right"
              class="mt-1 size-4 text-dimmed transition-transform group-hover:translate-x-0.5"
            />
          </NuxtLink>
        </li>
      </ul>
      <UEmpty
        v-else
        icon="i-lucide-cpu"
        title="No products yet"
        description="Create a product first, then write its documentation."
        :actions="[{ label: 'Products', to: '/admin/products' }]"
      />
    </template>
  </UDashboardPanel>
</template>
