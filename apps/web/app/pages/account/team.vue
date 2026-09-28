<script setup lang="ts">
definePageMeta({ layout: 'client' })

const { data: user } = useCurrentUser()
const adminMemberships = computed(
  () => user.value?.memberships.filter((membership) => membership.role === 'admin') ?? [],
)

useSeoMeta({ title: 'Team' })
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-highlighted">Team</h1>
    <UCard v-for="membership in adminMemberships" :key="membership.clientAccountId">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="font-medium text-highlighted">{{ membership.clientAccountName }}</p>
          <p class="text-sm text-muted">Invite colleagues to access your products.</p>
        </div>
        <InvitationCreateModal
          :client-account-id="membership.clientAccountId"
          :client-account-name="membership.clientAccountName"
          button-label="Invite colleague"
        />
      </div>
    </UCard>
    <UAlert
      v-if="adminMemberships.length === 0"
      color="neutral"
      variant="subtle"
      title="Only client admins can invite colleagues"
    />
  </div>
</template>
