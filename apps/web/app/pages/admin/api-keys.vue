<script setup lang="ts">
import type { ApiKey } from '@entitled/contracts/api-keys'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard' })

const { data: user } = useCurrentUser()
const isAdmin = computed(() => user.value?.vendorRole === 'admin')
const { data: keys, refresh } = await useFetch<ApiKey[]>('/api/api-keys', {
  key: 'api-keys',
  default: () => [],
  immediate: isAdmin.value,
})
const toast = useToast()
const requestUrl = useRequestURL()

const columns: TableColumn<ApiKey>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'start', header: 'Key', cell: ({ row }) => `${row.original.start ?? ''}…` },
  { accessorKey: 'ownerEmail', header: 'Owner' },
  {
    accessorKey: 'lastUsedAt',
    header: 'Last used',
    cell: ({ row }) => dateCell(row.original.lastUsedAt),
  },
  {
    accessorKey: 'expiresAt',
    header: 'Expires',
    cell: ({ row }) => dateCell(row.original.expiresAt),
  },
  { id: 'actions', header: '' },
]

const snippet = computed(
  () => `publish-to-entitled:
  stage: deploy
  image: alpine:3.22
  rules:
    - if: $CI_COMMIT_TAG
  variables:
    ENTITLED_URL: ${requestUrl.origin}
    ENTITLED_PRODUCT: your-product-slug
    ENTITLED_CHANGELOG: CHANGELOG.md
    ENTITLED_PUBLISH: 'false'
  before_script:
    - apk add --no-cache curl jq coreutils
  script:
    - curl -fsSL "$ENTITLED_URL/ci/entitled-release.sh" -o entitled-release.sh
    - sh entitled-release.sh build/firmware.bin`,
)

async function revoke(key: ApiKey) {
  try {
    await $fetch(`/api/api-keys/${key.id}`, { method: 'DELETE' })
    toast.add({ title: `${key.name} revoked`, color: 'success' })
    await refresh()
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
}

useSeoMeta({ title: 'API keys' })
</script>

<template>
  <UDashboardPanel id="api-keys">
    <template #header>
      <UDashboardNavbar title="CI API keys">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <ApiKeyCreateModal v-if="isAdmin" @created="refresh" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UAlert
        v-if="!isAdmin"
        color="neutral"
        variant="subtle"
        title="Only vendor admins manage API keys"
      />
      <template v-else>
        <UTable :data="keys" :columns="columns" empty="No API keys yet">
          <template #actions-cell="{ row }">
            <div class="flex justify-end">
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                :aria-label="`Revoke ${row.original.name}`"
                @click="revoke(row.original)"
              />
            </div>
          </template>
        </UTable>
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">GitLab CI/CD</h2>
            <p class="text-sm text-muted">
              Add this job to <code>.gitlab-ci.yml</code> and store the key as a masked variable
              named <code>ENTITLED_API_KEY</code>. Tag pipelines then create the release, upload the
              files and wait until every checksum is verified.
            </p>
          </template>
          <pre
            class="overflow-x-auto rounded-md bg-elevated p-4 text-sm"
          ><code>{{ snippet }}</code></pre>
        </UCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
