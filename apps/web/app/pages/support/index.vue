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
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold text-highlighted">Support</h1>
      <UButton to="/support/new" icon="i-lucide-plus" label="New request" />
    </div>
    <UTable :data="threads" :columns="columns" empty="No support requests yet">
      <template #subject-cell="{ row }">
        <ULink :to="`/support/${row.original.id}`" class="font-medium text-highlighted">
          {{ row.original.subject }}
        </ULink>
      </template>
      <template #status-cell="{ row }">
        <UBadge
          variant="subtle"
          :color="supportStatusColor[row.original.status]"
          :label="supportStatusLabel[row.original.status]"
        />
      </template>
    </UTable>
  </div>
</template>
