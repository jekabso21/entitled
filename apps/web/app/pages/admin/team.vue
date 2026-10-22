<script setup lang="ts">
import {
  type VendorRole,
  type VendorStaffMember,
  vendorRoleSchema,
} from '@entitled/contracts/accounts'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard' })

const { data: user } = useCurrentUser()
const isAdmin = computed(() => user.value?.vendorRole === 'admin')
const { data: staff, refresh } = await useFetch<VendorStaffMember[]>('/api/vendor-staff', {
  key: 'vendor-staff',
  default: () => [],
  immediate: isAdmin.value,
})
const toast = useToast()

const roleItems = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Support', value: 'support' },
]

const columns: TableColumn<VendorStaffMember>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'twoFactorEnabled',
    header: '2FA',
    cell: ({ row }) => (row.original.twoFactorEnabled ? 'On' : 'Off'),
  },
  { accessorKey: 'vendorRole', header: 'Role' },
  { id: 'actions', header: '' },
]

async function update(member: VendorStaffMember, vendorRole: VendorRole | null) {
  try {
    await $fetch(`/api/vendor-staff/${member.userId}`, { method: 'PATCH', body: { vendorRole } })
    toast.add({
      title: vendorRole
        ? `${member.name} is now ${vendorRole}`
        : `${member.name} no longer has access`,
      color: 'success',
    })
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
  await refresh()
}

useSeoMeta({ title: 'Team' })
</script>

<template>
  <UDashboardPanel id="team">
    <template #header>
      <UDashboardNavbar title="Vendor team">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <InvitationCreateModal v-if="isAdmin" button-label="Invite vendor staff" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UAlert
        v-if="!isAdmin"
        color="neutral"
        variant="subtle"
        title="Only vendor admins manage the team"
      />
      <UTable v-else :data="staff" :columns="columns">
        <template #vendorRole-cell="{ row }">
          <USelect
            :model-value="row.original.vendorRole"
            :items="roleItems"
            :disabled="row.original.userId === user?.id"
            class="w-32"
            :aria-label="`Role of ${row.original.name}`"
            @update:model-value="update(row.original, vendorRoleSchema.parse($event))"
          />
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UButton
              v-if="row.original.userId !== user?.id"
              icon="i-lucide-user-x"
              color="error"
              variant="ghost"
              :aria-label="`Remove access for ${row.original.name}`"
              @click="update(row.original, null)"
            />
          </div>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
