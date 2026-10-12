<script setup lang="ts">
import {
  type CreateApiKeyInput,
  type CreatedApiKey,
  createApiKeyInputSchema,
} from '@entitled/contracts/api-keys'
import type { FormSubmitEvent } from '@nuxt/ui'

const emit = defineEmits<{ created: [] }>()

const open = ref(false)
const state = reactive<Partial<CreateApiKeyInput>>({ expiresInDays: 365 })
const created = ref<CreatedApiKey | null>(null)
const pending = ref(false)
const toast = useToast()

async function onSubmit(event: FormSubmitEvent<CreateApiKeyInput>) {
  pending.value = true
  try {
    created.value = await $fetch<CreatedApiKey>('/api/api-keys', {
      method: 'POST',
      body: event.data,
    })
    emit('created')
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    pending.value = false
  }
}

async function copyKey() {
  if (!created.value) return
  await navigator.clipboard.writeText(created.value.key)
  toast.add({ title: 'Key copied', color: 'success' })
}

watch(open, (isOpen) => {
  if (!isOpen) {
    created.value = null
    Object.assign(state, { name: undefined, expiresInDays: 365 })
  }
})
</script>

<template>
  <UModal v-model:open="open" title="New CI API key">
    <UButton icon="i-lucide-plus" label="New API key" />
    <template #body>
      <div v-if="created" class="space-y-4">
        <UAlert
          color="warning"
          variant="subtle"
          title="Copy this key now"
          description="It is shown only once. Store it as a masked CI/CD variable named ENTITLED_API_KEY."
        />
        <div class="flex items-center gap-2">
          <code class="flex-1 break-all rounded-md bg-elevated p-2 text-sm">{{ created.key }}</code>
          <UButton icon="i-lucide-copy" variant="soft" aria-label="Copy key" @click="copyKey" />
        </div>
      </div>
      <UForm
        v-else
        :schema="createApiKeyInputSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Name"
          name="name"
          help="Where it is used, e.g. GitLab CI — firmware repo"
        >
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Expires after (days)" name="expiresInDays">
          <UInputNumber v-model="state.expiresInDays" :min="1" :max="365" class="w-full" />
        </UFormField>
        <div class="flex justify-end">
          <UButton type="submit" :loading="pending" label="Create key" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
