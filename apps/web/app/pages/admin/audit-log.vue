<script setup lang="ts">
import type { AuditEntry, AuditPage } from '@entitled/contracts/audit'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard' })

const filters = [
  { label: 'Everything', value: 'all' },
  { label: 'Downloads', value: 'artifact.downloaded' },
  { label: 'Releases', value: 'release' },
  { label: 'Files', value: 'artifact' },
  { label: 'Entitlements', value: 'entitlement' },
  { label: 'Accounts & invitations', value: 'invitation' },
  { label: 'API keys', value: 'api_key' },
]
const filter = ref('all')
const action = computed(() => (filter.value === 'all' ? undefined : filter.value))

// The first page is fetched during SSR; "Load more" appends further pages in the browser.
const { data: firstPage, status } = await useFetch<AuditPage>('/api/audit-log', {
  key: 'audit-log',
  query: { limit: 50, action },
})
const more = ref<AuditEntry[]>([])
const moreCursor = ref<string | null | undefined>(undefined)
const loadingMore = ref(false)

const entries = computed(() => [...(firstPage.value?.entries ?? []), ...more.value])
const nextCursor = computed(() =>
  moreCursor.value === undefined ? (firstPage.value?.nextCursor ?? null) : moreCursor.value,
)

watch(filter, () => {
  more.value = []
  moreCursor.value = undefined
})

async function loadMore() {
  if (!nextCursor.value) return
  loadingMore.value = true
  try {
    const page = await $fetch<AuditPage>('/api/audit-log', {
      query: { limit: 50, action: action.value, cursor: nextCursor.value },
    })
    more.value.push(...page.entries)
    moreCursor.value = page.nextCursor
  } finally {
    loadingMore.value = false
  }
}

const columns: TableColumn<AuditEntry>[] = [
  {
    accessorKey: 'createdAt',
    header: 'When',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'actorEmail', header: 'Who' },
  {
    id: 'details',
    header: 'Details',
    cell: ({ row }) =>
      Object.entries(row.original.metadata)
        .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(' · '),
  },
]

useSeoMeta({ title: 'Audit log' })
</script>

<template>
  <UDashboardPanel id="audit-log">
    <template #header>
      <UDashboardNavbar title="Audit log">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <USelect v-model="filter" :items="filters" class="w-56" aria-label="Filter" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UTable
        :data="entries"
        :columns="columns"
        :loading="status === 'pending'"
        empty="Nothing recorded yet"
      >
        <template #actorEmail-cell="{ row }">
          <span>{{ row.original.actorEmail ?? 'system' }}</span>
          <UBadge
            v-if="row.original.viaApiKey"
            class="ml-2"
            variant="subtle"
            size="sm"
            label="API key"
          />
        </template>
      </UTable>
      <div v-if="nextCursor" class="flex justify-center">
        <UButton variant="soft" :loading="loadingMore" label="Load more" @click="loadMore" />
      </div>
    </template>
  </UDashboardPanel>
</template>
