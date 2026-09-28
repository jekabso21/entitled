<script setup lang="ts">
const { public: config } = useRuntimeConfig()
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-8 bg-muted px-4 py-12">
    <p class="text-xl font-semibold text-highlighted">{{ config.portalName }}</p>
    <UCard class="w-full max-w-sm">
      <slot />
    </UCard>
  </div>
</template>
