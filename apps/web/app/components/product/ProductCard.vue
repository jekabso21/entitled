<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'

const { product } = defineProps<{ product: Product }>()
</script>

<template>
  <UCard as="article" class="transition hover:ring-primary">
    <NuxtLink :to="`/products/${product.id}`" class="block space-y-2">
      <h2 class="font-semibold text-highlighted">{{ product.name }}</h2>
      <p v-if="product.description" class="line-clamp-2 text-sm text-muted">
        {{ product.description }}
      </p>
      <div class="flex flex-wrap gap-1">
        <UBadge
          v-for="revision in product.revisions"
          :key="revision.id"
          variant="subtle"
          color="neutral"
          :label="`Rev ${revision.code}`"
        />
      </div>
    </NuxtLink>
  </UCard>
</template>
