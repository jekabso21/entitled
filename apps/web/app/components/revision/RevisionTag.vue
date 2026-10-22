<script setup lang="ts">
const { code, isMuted = false } = defineProps<{ code: string; isMuted?: boolean }>()
</script>

<template>
  <span
    class="inline-flex h-[22px] items-center rounded-sm border px-1.5 font-mono text-xs font-medium whitespace-nowrap"
    :class="isMuted ? 'border-default text-dimmed' : 'border-accented bg-default text-muted'"
  >
    Rev {{ code }}
  </span>
</template>
