<script setup lang="ts">
definePageMeta({ layout: 'client' })

useSeoMeta({ title: 'Security' })
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <h1 class="text-2xl font-semibold text-highlighted">Security</h1>
    <AccountTwoFactor />
  </div>
</template>
