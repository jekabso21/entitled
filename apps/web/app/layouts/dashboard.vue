<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links: NavigationMenuItem[] = [
  { label: 'Overview', icon: 'i-lucide-layout-dashboard', to: '/admin', exact: true },
  { label: 'Support', icon: 'i-lucide-life-buoy', to: '/admin/support' },
  { label: 'Products', icon: 'i-lucide-cpu', to: '/admin/products' },
  { label: 'Client accounts', icon: 'i-lucide-building-2', to: '/admin/client-accounts' },
  { label: 'Invitations', icon: 'i-lucide-mail', to: '/admin/invitations' },
  { label: 'API keys', icon: 'i-lucide-key-round', to: '/admin/api-keys' },
  { label: 'Audit log', icon: 'i-lucide-scroll-text', to: '/admin/audit-log' },
  { label: 'Settings', icon: 'i-lucide-settings', to: '/admin/settings' },
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar id="main" collapsible resizable>
      <template #header="{ collapsed }">
        <BrandMark :compact="collapsed" :class="collapsed ? 'mx-auto' : ''" />
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
