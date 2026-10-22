<script setup lang="ts">
import type { DocAsset } from '@entitled/contracts/docs'
import type { Product } from '@entitled/contracts/products'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const productId = computed(() => String(route.params.productId))
const toast = useToast()
const { data: user } = useCurrentUser()
const canDelete = computed(() => ['admin', 'editor'].includes(user.value?.vendorRole ?? ''))

const { data: product } = await useFetch<Product>(() => `/api/products/${productId.value}`, {
  key: `product-${productId.value}`,
})
const { data: files, refresh } = await useFetch<DocAsset[]>(
  () => `/api/products/${productId.value}/doc-assets`,
  { key: `doc-assets-${productId.value}`, default: () => [] },
)

const filter = ref<'all' | 'unused'>('all')
const shown = computed(() =>
  filter.value === 'unused' ? files.value.filter((file) => !file.usedBy.length) : files.value,
)
const unusedCount = computed(() => files.value.filter((file) => !file.usedBy.length).length)
const totalBytes = computed(() => files.value.reduce((sum, file) => sum + file.sizeBytes, 0))

const deleting = ref(false)
const isConfirmOpen = ref(false)
async function remove(assetIds: string[] | null) {
  deleting.value = true
  try {
    const { deleted } = await $fetch<{ deleted: number }>(
      `/api/products/${productId.value}/doc-assets/delete`,
      { method: 'POST', body: { assetIds } },
    )
    toast.add({
      title: `${String(deleted)} ${deleted === 1 ? 'file' : 'files'} deleted`,
      color: 'success',
    })
    isConfirmOpen.value = false
    await refresh()
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    deleting.value = false
  }
}

const isImage = (file: DocAsset) => file.contentType.startsWith('image/')

const columns: TableColumn<DocAsset>[] = [
  { accessorKey: 'fileName', header: 'File' },
  { id: 'usedBy', header: 'Used on' },
  { accessorKey: 'sizeBytes', header: 'Size' },
  { accessorKey: 'createdAt', header: 'Uploaded' },
  { id: 'actions', header: () => h('span', { class: 'sr-only' }, 'Actions') },
]

useSeoMeta({ title: () => `Files · ${product.value?.name ?? 'Documentation'}` })
</script>

<template>
  <UDashboardPanel id="doc-files">
    <template #header>
      <UDashboardNavbar :title="product ? `${product.name} files` : 'Files'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            :to="`/admin/docs/${productId}`"
            aria-label="Back to the documentation"
          />
        </template>
        <template #right>
          <UButton
            v-if="canDelete && unusedCount"
            icon="i-lucide-trash-2"
            color="error"
            variant="soft"
            :label="`Delete ${unusedCount} unused`"
            @click="isConfirmOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <p class="text-sm text-muted">
            {{ files.length }} files · {{ formatBytes(totalBytes) }} · {{ unusedCount }} not used on
            any page
          </p>
          <UTabs
            v-model="filter"
            :items="[
              { label: 'All files', value: 'all' },
              { label: 'Not used', value: 'unused' },
            ]"
            :content="false"
            size="xs"
            class="ml-auto"
          />
        </div>
        <UTable :data="shown" :columns="columns" empty="No files uploaded yet.">
          <template #fileName-cell="{ row }">
            <a
              :href="row.original.url"
              target="_blank"
              class="flex items-center gap-3 hover:text-primary"
            >
              <img
                v-if="isImage(row.original)"
                :src="row.original.url"
                alt=""
                loading="lazy"
                class="size-10 shrink-0 border border-default object-cover"
              />
              <span
                v-else
                class="flex size-10 shrink-0 items-center justify-center border border-default bg-muted"
              >
                <UIcon name="i-lucide-file" class="size-4 text-muted" />
              </span>
              <span class="truncate font-mono text-sm">{{ row.original.fileName }}</span>
            </a>
          </template>
          <template #usedBy-cell="{ row }">
            <div v-if="row.original.usedBy.length" class="flex flex-wrap gap-1">
              <UButton
                v-for="page in row.original.usedBy"
                :key="page.id"
                :to="`/admin/docs/${productId}/${page.id}`"
                :label="page.title"
                size="xs"
                color="neutral"
                variant="soft"
              />
            </div>
            <UBadge v-else color="warning" variant="subtle" label="Not used" />
          </template>
          <template #sizeBytes-cell="{ row }">{{ formatBytes(row.original.sizeBytes) }}</template>
          <template #createdAt-cell="{ row }">{{ formatDate(row.original.createdAt) }}</template>
          <template #actions-cell="{ row }">
            <UButton
              v-if="canDelete && !row.original.usedBy.length"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              :aria-label="`Delete ${row.original.fileName}`"
              :loading="deleting"
              @click="remove([row.original.id])"
            />
            <span v-else class="sr-only">In use</span>
          </template>
        </UTable>
        <p class="text-xs text-dimmed">
          “Used on” reads the current text of each page. Older versions in a page’s history may
          still point to a file you delete.
        </p>
      </div>

      <UModal v-model:open="isConfirmOpen" :title="`Delete ${unusedCount} unused files?`">
        <template #body>
          <p class="text-sm">
            No page links to these files any more. They are removed from storage and can’t be
            brought back.
          </p>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="isConfirmOpen = false"
            />
            <UButton label="Delete files" color="error" :loading="deleting" @click="remove(null)" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
