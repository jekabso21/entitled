<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const {
  title,
  description = '',
  breadcrumbs = [],
  isMono = false,
} = defineProps<{
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  isMono?: boolean
}>()
</script>

<template>
  <header class="space-y-3 border-b border-default pb-5">
    <UBreadcrumb v-if="breadcrumbs.length" :items="breadcrumbs" />
    <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div class="min-w-0 space-y-1">
        <h1
          class="text-2xl font-semibold tracking-tight text-highlighted sm:text-[28px] sm:leading-9"
          :class="{ 'font-mono font-medium tracking-normal': isMono }"
        >
          {{ title }}
        </h1>
        <p v-if="description" class="max-w-prose text-muted">{{ description }}</p>
        <div v-if="$slots.meta" class="flex flex-wrap items-center gap-2 pt-1">
          <slot name="meta" />
        </div>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
