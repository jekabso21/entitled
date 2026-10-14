<script setup lang="ts">
const { compact = false } = defineProps<{ compact?: boolean }>()
const { data: branding } = useBranding()
</script>

<template>
  <span class="flex min-w-0 items-center gap-2">
    <img
      v-if="branding.logoUrl"
      :src="branding.logoUrl"
      :alt="compact ? branding.portalName : ''"
      class="h-7 w-auto max-w-32 object-contain"
    />
    <UIcon v-else-if="compact" name="i-lucide-box" class="size-5 text-primary" />
    <span v-if="!compact" class="truncate font-semibold text-highlighted">
      {{ branding.portalName }}
    </span>
  </span>
</template>
