<script setup lang="ts">
const { public: config } = useRuntimeConfig()
const { data: user } = useCurrentUser()
const isClientAdmin = computed(
  () => user.value?.memberships.some((membership) => membership.role === 'admin') ?? false,
)
</script>

<template>
  <div class="min-h-dvh bg-default">
    <header class="border-b border-default">
      <UContainer class="flex h-14 items-center justify-between gap-4">
        <NuxtLink to="/" class="font-semibold text-highlighted">{{ config.portalName }}</NuxtLink>
        <nav class="flex items-center gap-1">
          <UButton to="/" label="Products" variant="ghost" color="neutral" />
          <UButton
            v-if="isClientAdmin"
            to="/account/team"
            label="Team"
            variant="ghost"
            color="neutral"
          />
          <UserMenu />
        </nav>
      </UContainer>
    </header>
    <UContainer class="py-8">
      <slot />
    </UContainer>
  </div>
</template>
