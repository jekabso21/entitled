<script setup lang="ts">
import type { ClientAccount } from '@entitled/contracts/client-accounts'
import type { Invitation } from '@entitled/contracts/invitations'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard' })

const { data: user } = useCurrentUser()
const isAdmin = computed(() => user.value?.vendorRole === 'admin')
const { data: invitations, refresh } = await useFetch<Invitation[]>('/api/invitations', {
  key: 'invitations',
  default: () => [],
  immediate: isAdmin.value,
})
const { data: accounts } = await useFetch<ClientAccount[]>('/api/client-accounts', {
  key: 'client-accounts',
  default: () => [],
})
const accountNames = computed(
  () => new Map(accounts.value.map((account) => [account.id, account.name])),
)

const columns: TableColumn<Invitation>[] = [
  { accessorKey: 'email', header: 'Email' },
  {
    id: 'target',
    header: 'Joins',
    cell: ({ row }) =>
      row.original.clientAccountId
        ? (accountNames.value.get(row.original.clientAccountId) ?? 'Client account')
        : 'Vendor team',
  },
  {
    id: 'role',
    header: 'Role',
    cell: ({ row }) => row.original.vendorRole ?? row.original.clientRole ?? '',
  },
  {
    accessorKey: 'expiresAt',
    header: 'Expires',
    cell: ({ row }) => new Date(row.original.expiresAt).toLocaleDateString(),
  },
]

useSeoMeta({ title: 'Invitations' })
</script>

<template>
  <UDashboardPanel id="invitations">
    <template #header>
      <UDashboardNavbar title="Pending invitations">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <InvitationCreateModal
            v-if="isAdmin"
            button-label="Invite vendor staff"
            @invited="refresh"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UAlert
        v-if="!isAdmin"
        color="neutral"
        variant="subtle"
        title="Only vendor admins manage invitations"
      />
      <UTable v-else :data="invitations" :columns="columns" empty="No pending invitations" />
    </template>
  </UDashboardPanel>
</template>
