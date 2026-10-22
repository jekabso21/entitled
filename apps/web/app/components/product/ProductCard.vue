<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'

const { product } = defineProps<{ product: Product }>()
</script>

<template>
  <NuxtLink
    :to="`/products/${product.id}`"
    class="group flex flex-col gap-3 border border-default bg-default p-5 transition-colors hover:border-accented focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
  >
    <div class="flex items-start gap-3">
      <span class="flex size-9 shrink-0 items-center justify-center bg-elevated text-muted">
        <UIcon name="i-lucide-cpu" class="size-5" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="font-semibold text-highlighted group-hover:text-primary">{{ product.name }}</h2>
        <p v-if="product.description" class="mt-0.5 line-clamp-2 text-sm text-muted">
          {{ product.description }}
        </p>
      </div>
      <UIcon
        name="i-lucide-chevron-right"
        class="mt-0.5 size-4 shrink-0 text-dimmed transition-transform group-hover:translate-x-0.5"
      />
    </div>
    <div v-if="product.revisions.length" class="mt-auto flex flex-wrap gap-1">
      <RevisionTag v-for="revision in product.revisions" :key="revision.id" :code="revision.code" />
    </div>
  </NuxtLink>
</template>
