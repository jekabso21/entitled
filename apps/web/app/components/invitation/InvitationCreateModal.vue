<script setup lang="ts">
import { clientRoleSchema, vendorRoleSchema } from '@entitled/contracts/accounts'
import type { CreateInvitationInput } from '@entitled/contracts/invitations'
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

const {
  clientAccountId = null,
  clientAccountName = null,
  buttonLabel = 'Invite',
} = defineProps<{
  clientAccountId?: string | null
  clientAccountName?: string | null
  buttonLabel?: string
}>()
const emit = defineEmits<{ invited: [] }>()

const isClient = computed(() => clientAccountId !== null)
const schema = z.object({
  email: z.email({ error: 'Enter a valid email' }),
  role: z.union([vendorRoleSchema, clientRoleSchema]),
})
type Schema = z.output<typeof schema>

const roleItems = computed(() =>
  isClient.value
    ? [
        { label: 'Client user', value: 'member' },
        { label: 'Client admin', value: 'admin' },
      ]
    : [
        { label: 'Editor', value: 'editor' },
        { label: 'Support', value: 'support' },
        { label: 'Admin', value: 'admin' },
      ],
)

const open = ref(false)
const defaultRole = () => (isClient.value ? 'member' : 'editor')
const state = reactive<Partial<Schema>>({ role: defaultRole() })
const pending = ref(false)
const toast = useToast()

function toInput(data: Schema): CreateInvitationInput {
  if (clientAccountId) {
    return {
      kind: 'client',
      email: data.email,
      clientAccountId,
      clientRole: clientRoleSchema.parse(data.role),
    }
  }
  return { kind: 'vendor', email: data.email, vendorRole: vendorRoleSchema.parse(data.role) }
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  pending.value = true
  try {
    await $fetch('/api/invitations', { method: 'POST', body: toInput(event.data) })
    toast.add({ title: `Invitation sent to ${event.data.email}`, color: 'success' })
    open.value = false
    state.email = undefined
    state.role = defaultRole()
    emit('invited')
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="clientAccountName ? `Invite to ${clientAccountName}` : 'Invite vendor staff'"
  >
    <UButton icon="i-lucide-user-plus" :label="buttonLabel" variant="soft" size="sm" />
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" class="w-full" />
        </UFormField>
        <UFormField label="Role" name="role">
          <USelect v-model="state.role" :items="roleItems" class="w-full" />
        </UFormField>
        <div class="flex justify-end">
          <UButton type="submit" :loading="pending" label="Send invitation" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
