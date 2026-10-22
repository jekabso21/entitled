<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'

const { label, color = 'neutral' } = defineProps<{ label: string; color?: BadgeProps['color'] }>()
</script>

<template>
  <UBadge :color="color" variant="subtle" class="gap-1.5">
    <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
    {{ label }}
  </UBadge>
</template>
