<script setup lang="ts">
const { data: branding } = useBranding()

useHead({
  titleTemplate: (title) =>
    title ? `${title} · ${branding.value.portalName}` : branding.value.portalName,
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
