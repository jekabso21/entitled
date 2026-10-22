<script setup lang="ts">
import type { InvitationPreview } from '@entitled/contracts/invitations'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const token = computed(() => String(route.params.token))
const { data: invitation, error } = await useFetch<InvitationPreview>(
  () => `/api/invitations/${token.value}`,
  { key: `invitation-${token.value}` },
)
const { data: user, refresh } = useCurrentUser()

async function onAccepted() {
  await refresh()
  await navigateTo(user.value ? homePath(user.value) : '/login')
}

useSeoMeta({ title: 'Accept invitation' })
</script>

<template>
  <div class="space-y-6">
    <template v-if="invitation">
      <div class="space-y-1">
        <h1 class="text-xl font-semibold tracking-tight text-highlighted">You're invited</h1>
        <p class="text-sm text-muted">
          {{
            invitation.accountName
              ? `Join ${invitation.accountName} on this portal.`
              : 'Join the vendor team on this portal.'
          }}
        </p>
      </div>
      <InviteAcceptForm :token="token" :email="invitation.email" @accepted="onAccepted" />
    </template>
    <UAlert
      v-else-if="error"
      color="warning"
      variant="subtle"
      title="This invitation is invalid or has expired"
      description="Ask whoever invited you to send a new one."
    />
  </div>
</template>
