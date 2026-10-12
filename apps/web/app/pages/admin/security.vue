<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

useSeoMeta({ title: 'Security' })
</script>

<template>
  <UDashboardPanel id="security">
    <template #header>
      <UDashboardNavbar title="Security">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="max-w-3xl">
        <AccountTwoFactor />
      </div>
    </template>
  </UDashboardPanel>
</template>
