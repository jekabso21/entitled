<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { collapsed = false } = defineProps<{ collapsed?: boolean }>()

const { data: user } = useCurrentUser()
const signOut = useSignOut()

const items = computed<DropdownMenuItem[][]>(() => [
  [{ label: user.value?.email ?? '', type: 'label' }],
  [{ label: 'Sign out', icon: 'i-lucide-log-out', onSelect: () => void signOut() }],
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'start' }">
    <UButton
      :label="collapsed ? undefined : user?.name"
      icon="i-lucide-circle-user"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="justify-start"
    />
  </UDropdownMenu>
</template>
