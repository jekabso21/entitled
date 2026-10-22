<script setup lang="ts">
import type { ClientAccount } from '@entitled/contracts/client-accounts'
import type { Invitation } from '@entitled/contracts/invitations'
import type { SupportThreadSummary } from '@entitled/contracts/support'

definePageMeta({ layout: 'dashboard' })

const { data: user } = useCurrentUser()
const { data: accounts } = await useFetch<ClientAccount[]>('/api/client-accounts', {
  key: 'client-accounts',
  default: () => [],
})
const isAdmin = computed(() => user.value?.vendorRole === 'admin')
const canEdit = computed(() => ['admin', 'editor'].includes(user.value?.vendorRole ?? ''))
const { data: invitations } = await useFetch<Invitation[]>('/api/invitations', {
  key: 'invitations',
  default: () => [],
  immediate: isAdmin.value,
})
const { data: openThreads } = await useFetch<SupportThreadSummary[]>('/api/support/threads', {
  key: 'admin-overview-open-threads',
  query: { status: 'open' },
  default: () => [],
})

const stats = computed(() => [
  {
    label: 'Open support requests',
    value: openThreads.value.length,
    icon: 'i-lucide-life-buoy',
    to: '/admin/support',
  },
  {
    label: 'Client accounts',
    value: accounts.value.length,
    icon: 'i-lucide-building-2',
    to: '/admin/client-accounts',
  },
  {
    label: 'Client users',
    value: accounts.value.reduce((sum, account) => sum + account.memberCount, 0),
    icon: 'i-lucide-users',
    to: '/admin/client-accounts',
  },
  {
    label: 'Pending invitations',
    value: invitations.value.length,
    icon: 'i-lucide-mail',
    to: '/admin/invitations',
  },
])

const quickActions = computed(() =>
  [
    {
      label: 'Publish a release',
      icon: 'i-lucide-cpu',
      to: '/admin/products',
      show: canEdit.value,
    },
    {
      label: 'Add a client account',
      icon: 'i-lucide-building-2',
      to: '/admin/client-accounts',
      show: isAdmin.value,
    },
    {
      label: 'Invite a user',
      icon: 'i-lucide-mail',
      to: '/admin/invitations',
      show: isAdmin.value,
    },
    {
      label: 'Portal branding',
      icon: 'i-lucide-palette',
      to: '/admin/settings',
      show: isAdmin.value,
    },
  ].filter((action) => action.show),
)

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
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NuxtLink
          v-for="stat in stats"
          :key="stat.label"
          :to="stat.to"
          class="group flex items-center gap-4 border border-default bg-default p-5 transition-colors hover:border-accented"
        >
          <span class="flex size-10 shrink-0 items-center justify-center bg-elevated text-muted">
            <UIcon :name="stat.icon" class="size-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm text-muted">{{ stat.label }}</span>
            <span class="block text-2xl font-semibold text-highlighted tabular-nums">{{
              stat.value
            }}</span>
          </span>
        </NuxtLink>
      </div>
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section class="border border-default bg-default">
          <header class="flex items-center justify-between gap-3 border-b border-default px-5 py-3">
            <h2 class="font-semibold text-highlighted">Waiting for a reply</h2>
            <UButton
              to="/admin/support"
              label="All requests"
              variant="link"
              color="neutral"
              trailing-icon="i-lucide-arrow-right"
              class="px-0"
            />
          </header>
          <ul v-if="openThreads.length" class="divide-y divide-default">
            <li v-for="thread in openThreads.slice(0, 6)" :key="thread.id">
              <NuxtLink
                :to="`/admin/support/${thread.id}`"
                class="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-muted"
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-medium text-highlighted">{{
                    thread.subject
                  }}</span>
                  <span class="block truncate text-xs text-dimmed"
                    >{{ thread.clientAccountName }} · {{ thread.productName }}</span
                  >
                </span>
                <span class="text-xs text-dimmed tabular-nums">{{
                  formatDateTime(thread.lastMessageAt)
                }}</span>
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="flex items-center gap-2 px-5 py-6 text-sm text-muted">
            <UIcon name="i-lucide-circle-check" class="size-4 text-success" />
            No open requests. Every client has an answer.
          </p>
        </section>
        <section v-if="quickActions.length" class="border border-default bg-default">
          <h2 class="border-b border-default px-5 py-3 font-semibold text-highlighted">
            Quick actions
          </h2>
          <ul class="p-2">
            <li v-for="action in quickActions" :key="action.label">
              <NuxtLink
                :to="action.to"
                class="flex min-h-10 items-center gap-3 rounded-sm px-3 text-sm text-default transition-colors hover:bg-elevated hover:text-highlighted"
              >
                <UIcon :name="action.icon" class="size-4 text-dimmed" />
                <span class="flex-1">{{ action.label }}</span>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-dimmed" />
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
