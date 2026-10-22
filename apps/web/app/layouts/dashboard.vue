<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links: NavigationMenuItem[][] = [
  [
    { label: 'Overview', icon: 'i-lucide-layout-dashboard', to: '/admin', exact: true },
    { label: 'Support', icon: 'i-lucide-life-buoy', to: '/admin/support' },
    { label: 'Products', icon: 'i-lucide-cpu', to: '/admin/products' },
    { label: 'Documentation', icon: 'i-lucide-book-open', to: '/admin/docs' },
    { label: 'Client accounts', icon: 'i-lucide-building-2', to: '/admin/client-accounts' },
  ],
  [
    { label: 'Access', type: 'label' },
    { label: 'Invitations', icon: 'i-lucide-mail', to: '/admin/invitations' },
    { label: 'Team', icon: 'i-lucide-users', to: '/admin/team' },
    { label: 'API keys', icon: 'i-lucide-key-round', to: '/admin/api-keys' },
  ],
  [
    { label: 'System', type: 'label' },
    { label: 'Audit log', icon: 'i-lucide-scroll-text', to: '/admin/audit-log' },
    { label: 'Settings', icon: 'i-lucide-settings', to: '/admin/settings' },
  ],
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      id="main"
      collapsible
      resizable
      :default-size="18"
      :ui="{ header: 'border-b border-default', footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <BrandMark :compact="collapsed" :class="collapsed ? 'mx-auto' : ''" />
      </template>
      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          :ui="{
            separator: 'my-2 opacity-0',
            label: 'px-2.5 pt-1 pb-1 text-[11px] font-medium text-dimmed',
            link: 'py-2 before:rounded-sm data-active:before:bg-primary/10 data-active:font-semibold',
          }"
        />
      </template>
      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
