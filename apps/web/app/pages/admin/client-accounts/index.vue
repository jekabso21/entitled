<script setup lang="ts">
import type { ClientAccount } from '@entitled/contracts/client-accounts'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard' })

const { data: user } = useCurrentUser()
const isAdmin = computed(() => user.value?.vendorRole === 'admin')
const { data: accounts, refresh } = await useFetch<ClientAccount[]>('/api/client-accounts', {
  key: 'client-accounts',
  default: () => [],
})

const columns: TableColumn<ClientAccount>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'memberCount', header: 'Users' },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  { id: 'actions', header: '' },
]

useSeoMeta({ title: 'Client accounts' })
</script>

<template>
  <UDashboardPanel id="client-accounts">
    <template #header>
      <UDashboardNavbar title="Client accounts">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <ClientAccountCreateModal v-if="isAdmin" @created="refresh" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UTable :data="accounts" :columns="columns" empty="No client accounts yet">
        <template #name-cell="{ row }">
          <ULink
            :to="`/admin/client-accounts/${row.original.id}`"
            class="font-medium text-highlighted"
          >
            {{ row.original.name }}
          </ULink>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <InvitationCreateModal
              v-if="isAdmin"
              :client-account-id="row.original.id"
              :client-account-name="row.original.name"
              button-label="Invite user"
              @invited="refreshNuxtData('invitations')"
            />
          </div>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
