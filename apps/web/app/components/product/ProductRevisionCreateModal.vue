<script setup lang="ts">
import { type CreateRevisionInput, createRevisionInputSchema } from '@entitled/contracts/products'
import type { FormSubmitEvent } from '@nuxt/ui'

const { productId } = defineProps<{ productId: string }>()
const emit = defineEmits<{ created: [] }>()

const open = ref(false)
const state = reactive<Partial<CreateRevisionInput>>({})
const pending = ref(false)
const toast = useToast()

async function onSubmit(event: FormSubmitEvent<CreateRevisionInput>) {
  pending.value = true
  try {
    await $fetch(`/api/products/${productId}/revisions`, { method: 'POST', body: event.data })
    toast.add({ title: `Revision ${event.data.code} added`, color: 'success' })
    open.value = false
    Object.assign(state, { code: undefined, name: undefined })
    emit('created')
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
    title="Add hardware revision"
    description="Revisions are ordered; release ranges compare their position."
  >
    <UButton icon="i-lucide-plus" label="Add revision" variant="soft" />
    <template #body>
      <UForm
        :schema="createRevisionInputSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Code" name="code" help="Short label such as A, B or 2.1">
          <UInput v-model="state.code" class="w-full" />
        </UFormField>
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <div class="flex justify-end">
          <UButton type="submit" :loading="pending" label="Add" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
