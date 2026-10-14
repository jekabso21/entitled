<script setup lang="ts">
import type { InstallSettings } from '@entitled/contracts/settings'

definePageMeta({ layout: 'dashboard' })

const { data: user } = useCurrentUser()
const isAdmin = computed(() => user.value?.vendorRole === 'admin')
const { data: settings, refresh } = await useFetch<InstallSettings>('/api/settings', {
  key: 'settings',
})
const toast = useToast()

async function update(patch: Partial<InstallSettings>) {
  try {
    await $fetch('/api/settings', { method: 'PATCH', body: patch })
    toast.add({ title: 'Settings saved', color: 'success' })
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
  await refresh()
}

useSeoMeta({ title: 'Settings' })
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="max-w-2xl space-y-6">
        <BrandingSettings v-if="isAdmin" />
        <UCard v-if="settings">
          <USwitch
            :model-value="settings.autoPublishReleases"
            :disabled="!isAdmin"
            label="Publish new releases immediately"
            description="When off, releases (including those from CI) land as drafts until someone publishes them."
            @update:model-value="update({ autoPublishReleases: $event })"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
