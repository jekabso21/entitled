<script setup lang="ts">
const { public: config } = useRuntimeConfig()
const { data: health, status } = useApiHealth()

useSeoMeta({ title: config.portalName })
</script>

<template>
  <UContainer class="flex min-h-dvh flex-col items-center justify-center gap-6">
    <h1 class="text-3xl font-semibold">{{ config.portalName }}</h1>
    <p class="text-muted">Firmware, documentation and support for your products.</p>
    <UBadge
      v-if="status === 'success'"
      :color="health?.status === 'ok' ? 'success' : 'warning'"
      variant="subtle"
    >
      API {{ health?.status }}
    </UBadge>
    <UBadge v-else-if="status === 'error'" color="error" variant="subtle">API unreachable</UBadge>
  </UContainer>
</template>
