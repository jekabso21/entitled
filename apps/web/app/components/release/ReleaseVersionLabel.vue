<script setup lang="ts">
const {
  version,
  isLatest = false,
  size = 'md',
} = defineProps<{ version: string; isLatest?: boolean; size?: 'sm' | 'md' | 'lg' }>()

const isPreRelease = computed(() => /-(alpha|beta|rc|pre|dev)/i.test(version))
const text = computed(() => (/^\d/.test(version) ? `v${version}` : version))
</script>

<template>
  <span class="inline-flex flex-wrap items-center" :class="size === 'lg' ? 'gap-2.5' : 'gap-2'">
    <span
      class="font-mono font-medium text-highlighted"
      :class="{
        'text-xs': size === 'sm',
        'text-sm': size === 'md',
        'text-[22px] leading-7 font-semibold': size === 'lg',
      }"
      >{{ text }}</span
    >
    <UBadge v-if="isLatest" label="Latest" variant="subtle" size="sm" />
    <UBadge v-if="isPreRelease" label="Pre-release" color="warning" variant="subtle" size="sm" />
  </span>
</template>
