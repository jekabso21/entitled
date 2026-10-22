<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { collapsed = false } = defineProps<{ collapsed?: boolean }>()

const { data: user } = useCurrentUser()
const signOut = useSignOut()
const colorMode = useColorMode()

const items = computed<DropdownMenuItem[][]>(() => [
  [{ label: user.value?.email ?? '', type: 'label' }],
  [
    {
      label: 'Security',
      icon: 'i-lucide-shield-check',
      to: user.value?.vendorRole ? '/admin/security' : '/account/security',
    },
    {
      label: 'Dark mode',
      icon: 'i-lucide-moon',
      type: 'checkbox',
      checked: colorMode.value === 'dark',
      onUpdateChecked: (isChecked: boolean) => {
        colorMode.preference = isChecked ? 'dark' : 'light'
      },
      onSelect: (event: Event) => {
        event.preventDefault()
      },
    },
  ],
  [{ label: 'Sign out', icon: 'i-lucide-log-out', onSelect: () => void signOut() }],
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }" :ui="{ content: 'min-w-56' }">
    <UButton
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      :aria-label="collapsed ? user?.name : undefined"
      class="justify-start gap-2"
    >
      <UAvatar :alt="user?.name" size="xs" />
      <span v-if="!collapsed" class="truncate">{{ user?.name }}</span>
      <UIcon
        v-if="!collapsed"
        name="i-lucide-chevrons-up-down"
        class="ms-auto size-4 shrink-0 text-dimmed"
      />
    </UButton>
  </UDropdownMenu>
</template>
