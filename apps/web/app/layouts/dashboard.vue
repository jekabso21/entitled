<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { public: config } = useRuntimeConfig()

const links: NavigationMenuItem[] = [
  { label: 'Overview', icon: 'i-lucide-layout-dashboard', to: '/admin', exact: true },
  { label: 'Products', icon: 'i-lucide-cpu', to: '/admin/products' },
  { label: 'Client accounts', icon: 'i-lucide-building-2', to: '/admin/client-accounts' },
  { label: 'Invitations', icon: 'i-lucide-mail', to: '/admin/invitations' },
  { label: 'Settings', icon: 'i-lucide-settings', to: '/admin/settings' },
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable>
      <template #header="{ collapsed }">
        <span v-if="!collapsed" class="truncate font-semibold text-highlighted">
          {{ config.portalName }}
        </span>
        <UIcon v-else name="i-lucide-box" class="mx-auto size-5" />
      </template>
      <template #default="{ collapsed }">
        <UNavigationMenu :collapsed="collapsed" :items="links" orientation="vertical" />
      </template>
      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
