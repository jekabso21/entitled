<script setup lang="ts">
import type { SupportThreadStatus, SupportThreadSummary } from '@entitled/contracts/support'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard' })

const status = ref<SupportThreadStatus | 'all'>('open')
const tabs = [
  { label: 'Open', value: 'open' },
  { label: 'Waiting on client', value: 'waiting_on_client' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All', value: 'all' },
]

const { data: threads } = await useFetch<SupportThreadSummary[]>('/api/support/threads', {
  key: 'admin-support-threads',
  query: { status: computed(() => (status.value === 'all' ? undefined : status.value)) },
  default: () => [],
})

const columns: TableColumn<SupportThreadSummary>[] = [
  { accessorKey: 'subject', header: 'Subject' },
  { accessorKey: 'clientAccountName', header: 'Client' },
  {
    id: 'product',
    header: 'Product',
    cell: ({ row }) =>
      row.original.releaseVersion
        ? `${row.original.productName} · ${row.original.releaseVersion}`
        : row.original.productName,
  },
  { accessorKey: 'status', header: 'Status' },
  {
    accessorKey: 'lastMessageAt',
    header: 'Last activity',
    cell: ({ row }) => formatDateTime(row.original.lastMessageAt),
  },
]

useSeoMeta({ title: 'Support' })
</script>

<template>
  <UDashboardPanel id="support">
    <template #header>
      <UDashboardNavbar title="Support">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <UTabs v-model="status" :items="tabs" :content="false" size="sm" variant="link" />
      </UDashboardToolbar>
    </template>
    <template #body>
      <UTable :data="threads" :columns="columns" empty="Nothing here">
        <template #subject-cell="{ row }">
          <ULink :to="`/admin/support/${row.original.id}`" class="font-medium text-highlighted">
            {{ row.original.subject }}
          </ULink>
        </template>
        <template #status-cell="{ row }">
          <StatusBadge
            :color="supportStatusColor[row.original.status]"
            :label="supportStatusLabel[row.original.status]"
          />
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
