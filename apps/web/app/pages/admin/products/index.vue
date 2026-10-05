<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard' })

const { data: user } = useCurrentUser()
const canEdit = computed(() => ['admin', 'editor'].includes(user.value?.vendorRole ?? ''))
const { data: products, refresh } = await useFetch<Product[]>('/api/products', {
  key: 'products',
  default: () => [],
})

const columns: TableColumn<Product>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'slug', header: 'Slug' },
  {
    id: 'revisions',
    header: 'Revisions',
    cell: ({ row }) => row.original.revisions.map((revision) => revision.code).join(', ') || '—',
  },
]

useSeoMeta({ title: 'Products' })
</script>

<template>
  <UDashboardPanel id="products">
    <template #header>
      <UDashboardNavbar title="Products">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <ProductCreateModal v-if="canEdit" @created="refresh" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UTable :data="products" :columns="columns" empty="No products yet">
        <template #name-cell="{ row }">
          <ULink :to="`/admin/products/${row.original.id}`" class="font-medium text-highlighted">
            {{ row.original.name }}
          </ULink>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
