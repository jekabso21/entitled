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
    <section
      v-for="membership in adminMemberships"
      :key="membership.clientAccountId"
      class="space-y-2"
    >
      <h2 v-if="adminMemberships.length > 1" class="font-medium text-highlighted">
        {{ membership.clientAccountName }}
      </h2>
      <AccountMembersCard :account-id="membership.clientAccountId" can-manage />
    </section>
    <UAlert
      v-if="adminMemberships.length === 0"
      color="neutral"
      variant="subtle"
      title="Only client admins can invite colleagues"
    />
  </div>
</template>
