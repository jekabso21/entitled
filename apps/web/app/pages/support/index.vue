<script setup lang="ts">
import type { SupportThreadSummary } from '@entitled/contracts/support'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'client' })

const { data: threads } = await useFetch<SupportThreadSummary[]>('/api/support/threads', {
  key: 'support-threads',
  default: () => [],
})

const columns: TableColumn<SupportThreadSummary>[] = [
  { accessorKey: 'subject', header: 'Subject' },
  { accessorKey: 'productName', header: 'Product' },
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
  <div class="space-y-6">
    <PageHeader
      title="Support"
      description="Your conversations with the support team. Replies also arrive by email."
    >
      <template #actions>
        <UButton to="/support/new" icon="i-lucide-plus" label="New request" />
      </template>
    </PageHeader>
    <UTable
      v-if="threads.length"
      :data="threads"
      :columns="columns"
      class="border border-default bg-default"
    >
      <template #subject-cell="{ row }">
        <ULink :to="`/support/${row.original.id}`" class="font-medium text-highlighted">
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
    <UEmpty
      v-else
      icon="i-lucide-life-buoy"
      title="No support requests yet"
      description="Stuck with an update or a unit? Open a request and the support team will reply here."
      :actions="[{ label: 'New request', to: '/support/new', icon: 'i-lucide-plus' }]"
      variant="outline"
      class="bg-default"
    />
  </div>
</template>
