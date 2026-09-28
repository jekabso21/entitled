<script setup lang="ts">
import type { ClientAccount } from '@entitled/contracts/client-accounts'
import type { Invitation } from '@entitled/contracts/invitations'

definePageMeta({ layout: 'dashboard' })

const { data: user } = useCurrentUser()
const { data: accounts } = await useFetch<ClientAccount[]>('/api/client-accounts', {
  key: 'client-accounts',
  default: () => [],
})
const isAdmin = computed(() => user.value?.vendorRole === 'admin')
const { data: invitations } = await useFetch<Invitation[]>('/api/invitations', {
  key: 'invitations',
  default: () => [],
  immediate: isAdmin.value,
})

const stats = computed(() => [
  { label: 'Client accounts', value: accounts.value.length, icon: 'i-lucide-building-2' },
  {
    label: 'Client users',
    value: accounts.value.reduce((sum, account) => sum + account.memberCount, 0),
    icon: 'i-lucide-users',
  },
  { label: 'Pending invitations', value: invitations.value.length, icon: 'i-lucide-mail' },
])

useSeoMeta({ title: 'Overview' })
</script>

<template>
  <UDashboardPanel id="overview">
    <template #header>
      <UDashboardNavbar title="Overview">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <p class="text-muted">Welcome back, {{ user?.name }}.</p>
      <div class="grid gap-4 sm:grid-cols-3">
        <UCard v-for="stat in stats" :key="stat.label">
          <div class="flex items-center gap-3">
            <UIcon :name="stat.icon" class="size-5 text-primary" />
            <div>
              <p class="text-sm text-muted">{{ stat.label }}</p>
              <p class="text-2xl font-semibold text-highlighted">{{ stat.value }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
