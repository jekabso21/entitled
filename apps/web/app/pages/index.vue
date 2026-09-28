<script setup lang="ts">
definePageMeta({ layout: 'client' })

const { data: user } = useCurrentUser()
const accountNames = computed(
  () => user.value?.memberships.map((membership) => membership.clientAccountName).join(', ') ?? '',
)

useSeoMeta({ title: 'Products' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">Your products</h1>
      <p class="text-muted">{{ accountNames }}</p>
    </div>
    <UEmpty
      icon="i-lucide-package"
      title="No products yet"
      description="Firmware releases and documentation appear here once your vendor grants access."
    />
  </div>
</template>
