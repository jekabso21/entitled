<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'
import type { Release } from '@entitled/contracts/releases'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const releaseId = computed(() => String(route.params.id))
const toast = useToast()

const { data: release, refresh } = await useFetch<Release>(
  () => `/api/releases/${releaseId.value}`,
  { key: `release-${releaseId.value}` },
)
const { data: product } = await useFetch<Product>(
  () => `/api/products/${release.value?.productId ?? ''}`,
  { key: `product-${release.value?.productId ?? 'none'}`, immediate: Boolean(release.value) },
)

// While checksums are computed in the background, poll until every file settles.
const hasProcessing = computed(
  () =>
    release.value?.artifacts.some((artifact) =>
      ['pending', 'processing'].includes(artifact.status),
    ) ?? false,
)
usePolling(() => refresh(), 2000, hasProcessing)

const changingStatus = ref(false)
async function changeStatus(action: 'publish' | 'archive') {
  changingStatus.value = true
  try {
    await $fetch(`/api/releases/${releaseId.value}/${action}`, { method: 'POST' })
    toast.add({
      title: action === 'publish' ? 'Release published' : 'Release archived',
      color: 'success',
    })
    await refresh()
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    changingStatus.value = false
  }
}

useSeoMeta({ title: () => (release.value ? `Release ${release.value.version}` : 'Release') })
</script>

<template>
  <UDashboardPanel id="release">
    <template #header>
      <UDashboardNavbar :title="release ? `${product?.name ?? ''} ${release.version}` : 'Release'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            :to="release ? `/admin/products/${release.productId}` : '/admin/products'"
          />
        </template>
        <template #trailing>
          <UBadge
            v-if="release"
            variant="subtle"
            :color="releaseStatusColor(release.status)"
            :label="release.status"
          />
        </template>
        <template #right>
          <UButton
            v-if="release?.status === 'draft'"
            icon="i-lucide-send"
            label="Publish to clients"
            :loading="changingStatus"
            :disabled="hasProcessing"
            @click="changeStatus('publish')"
          />
          <UButton
            v-else-if="release?.status === 'published'"
            icon="i-lucide-archive"
            label="Archive"
            color="neutral"
            variant="outline"
            :loading="changingStatus"
            @click="changeStatus('archive')"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <template v-if="release && product">
        <ReleaseStatusPanel :release="release" />
        <div class="grid gap-6 xl:grid-cols-5">
          <UCard class="xl:col-span-3">
            <ReleaseEditor
              :key="release.id + release.status"
              :release="release"
              :revisions="product.revisions"
              :product-name="product.name"
              @saved="refresh"
            />
          </UCard>
          <UCard class="self-start xl:sticky xl:top-4 xl:col-span-2">
            <ReleaseArtifacts :release="release" @changed="refresh" />
          </UCard>
        </div>
      </template>
    </template>
  </UDashboardPanel>
</template>
