<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'
import type { Release } from '@entitled/contracts/releases'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const productId = computed(() => String(route.params.id))
const { data: user } = useCurrentUser()
const canEdit = computed(() => ['admin', 'editor'].includes(user.value?.vendorRole ?? ''))
const { data: product, refresh } = await useFetch<Product>(
  () => `/api/products/${productId.value}`,
  {
    key: `product-${productId.value}`,
  },
)

const { data: releases } = await useFetch<Release[]>(
  () => `/api/products/${productId.value}/releases`,
  { key: `releases-${productId.value}`, default: () => [] },
)

const releaseColumns: TableColumn<Release>[] = [
  { accessorKey: 'version', header: 'Version' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'files', header: 'Files', cell: ({ row }) => row.original.artifacts.length },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
]

useSeoMeta({ title: () => product.value?.name ?? 'Product' })
</script>

<template>
  <UDashboardPanel id="product">
    <template #header>
      <UDashboardNavbar :title="product?.name ?? 'Product'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            to="/admin/products"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div v-if="product" class="space-y-6">
        <p v-if="product.description" class="text-muted">{{ product.description }}</p>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-highlighted">Hardware revisions</h2>
              <ProductRevisionCreateModal
                v-if="canEdit"
                :product-id="product.id"
                @created="refresh"
              />
            </div>
          </template>
          <ul v-if="product.revisions.length" class="divide-y divide-default">
            <li
              v-for="revision in product.revisions"
              :key="revision.id"
              class="flex items-center gap-3 py-2"
            >
              <UBadge variant="subtle" :label="revision.code" />
              <span>{{ revision.name }}</span>
            </li>
          </ul>
          <p v-else class="text-sm text-muted">No revisions yet.</p>
        </UCard>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-highlighted">Releases</h2>
              <ReleaseCreateModal v-if="canEdit" :product-id="product.id" />
            </div>
          </template>
          <UTable :data="releases" :columns="releaseColumns" empty="No releases yet">
            <template #version-cell="{ row }">
              <ULink
                :to="`/admin/releases/${row.original.id}`"
                class="font-medium text-highlighted"
              >
                {{ row.original.version }}
              </ULink>
            </template>
            <template #status-cell="{ row }">
              <UBadge
                variant="subtle"
                :color="releaseStatusColor(row.original.status)"
                :label="row.original.status"
              />
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
