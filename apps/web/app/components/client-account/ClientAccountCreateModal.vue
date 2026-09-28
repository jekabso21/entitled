<script setup lang="ts">
import {
  type CreateClientAccountInput,
  createClientAccountInputSchema,
} from '@entitled/contracts/client-accounts'
import type { FormSubmitEvent } from '@nuxt/ui'

const emit = defineEmits<{ created: [] }>()

const open = ref(false)
const state = reactive<Partial<CreateClientAccountInput>>({})
const pending = ref(false)
const toast = useToast()

watch(
  () => state.name,
  (name) => {
    state.slug = (name ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  },
)

async function onSubmit(event: FormSubmitEvent<CreateClientAccountInput>) {
  pending.value = true
  try {
    await $fetch('/api/client-accounts', { method: 'POST', body: event.data })
    toast.add({ title: `${event.data.name} created`, color: 'success' })
    open.value = false
    state.name = undefined
    emit('created')
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="New client account">
    <UButton icon="i-lucide-plus" label="New client account" />
    <template #body>
      <UForm
        :schema="createClientAccountInputSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Company name" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Slug" name="slug" help="Used in URLs; lowercase letters, digits, dashes">
          <UInput v-model="state.slug" class="w-full" />
        </UFormField>
        <div class="flex justify-end">
          <UButton type="submit" :loading="pending" label="Create" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
