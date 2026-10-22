<script setup lang="ts">
import { clientRoleSchema } from '@entitled/contracts/accounts'
import type { ClientAccountDetail } from '@entitled/contracts/client-accounts'
import type { Invitation } from '@entitled/contracts/invitations'

// Shared by vendor admins (account detail) and client admins (their team page).
const { accountId, canManage } = defineProps<{ accountId: string; canManage: boolean }>()

const { data: account, refresh } = await useFetch<ClientAccountDetail>(
  () => `/api/client-accounts/${accountId}`,
  { key: `client-account-${accountId}` },
)
const { data: invitations, refresh: refreshInvitations } = await useFetch<Invitation[]>(
  '/api/invitations',
  {
    key: `invitations-${accountId}`,
    query: { clientAccountId: accountId },
    default: () => [],
    immediate: canManage,
  },
)
const { data: user } = useCurrentUser()
const toast = useToast()

const roleItems = [
  { label: 'Client user', value: 'member' },
  { label: 'Client admin', value: 'admin' },
]

async function run(action: () => Promise<unknown>, success: string) {
  try {
    await action()
    toast.add({ title: success, color: 'success' })
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
  await Promise.all([refresh(), refreshInvitations()])
}

const changeRole = (userId: string, value: string) =>
  run(
    () =>
      $fetch(`/api/client-accounts/${accountId}/members/${userId}`, {
        method: 'PATCH',
        body: { role: clientRoleSchema.parse(value) },
      }),
    'Role updated',
  )
const removeMember = (userId: string, name: string) =>
  run(
    () => $fetch(`/api/client-accounts/${accountId}/members/${userId}`, { method: 'DELETE' }),
    `${name} removed`,
  )
const revokeInvitation = (invitation: Invitation) =>
  run(() => $fetch(`/api/invitations/${invitation.id}`, { method: 'DELETE' }), 'Invitation revoked')
</script>

<template>
  <UCard v-if="account">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-semibold text-highlighted">Users</h2>
        <InvitationCreateModal
          v-if="canManage"
          :client-account-id="account.id"
          :client-account-name="account.name"
          button-label="Invite"
          @invited="refreshInvitations"
        />
      </div>
    </template>
    <ul class="divide-y divide-default">
      <li
        v-for="member in account.members"
        :key="member.userId"
        class="flex flex-wrap items-center justify-between gap-3 py-2"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">{{ member.name }}</p>
          <p class="truncate text-sm text-muted">{{ member.email }}</p>
        </div>
        <div v-if="canManage" class="flex items-center gap-2">
          <USelect
            :model-value="member.role"
            :items="roleItems"
            class="w-36"
            :aria-label="`Role of ${member.name}`"
            @update:model-value="changeRole(member.userId, $event)"
          />
          <UButton
            v-if="member.userId !== user?.id"
            icon="i-lucide-user-minus"
            color="error"
            variant="ghost"
            :aria-label="`Remove ${member.name}`"
            @click="removeMember(member.userId, member.name)"
          />
        </div>
        <UBadge
          v-else
          variant="subtle"
          :color="member.role === 'admin' ? 'primary' : 'neutral'"
          :label="member.role === 'admin' ? 'Client admin' : 'Client user'"
        />
      </li>
      <li
        v-for="invitation in invitations"
        :key="invitation.id"
        class="flex flex-wrap items-center justify-between gap-3 py-2"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">{{ invitation.email }}</p>
          <p class="text-sm text-muted">Invited · expires {{ formatDate(invitation.expiresAt) }}</p>
        </div>
        <UButton
          variant="ghost"
          color="neutral"
          label="Revoke"
          :aria-label="`Revoke invitation for ${invitation.email}`"
          @click="revokeInvitation(invitation)"
        />
      </li>
    </ul>
    <p v-if="account.members.length === 0 && invitations.length === 0" class="text-sm text-muted">
      No users yet.
    </p>
  </UCard>
</template>
