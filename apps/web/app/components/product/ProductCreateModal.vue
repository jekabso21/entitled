<script setup lang="ts">
import { type CreateProductInput, createProductInputSchema } from '@entitled/contracts/products'
import type { FormSubmitEvent } from '@nuxt/ui'

const emit = defineEmits<{ created: [] }>()

const open = ref(false)
const state = reactive<Partial<CreateProductInput>>({})
const pending = ref(false)
const toast = useToast()

watch(
  () => state.name,
  (name) => {
    state.slug = toSlug(name ?? '')
  },
)

async function onSubmit(event: FormSubmitEvent<CreateProductInput>) {
  pending.value = true
  try {
    await $fetch('/api/products', { method: 'POST', body: event.data })
    toast.add({ title: `${event.data.name} created`, color: 'success' })
    open.value = false
    Object.assign(state, { name: undefined, slug: undefined, description: undefined })
    emit('created')
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="New product">
    <UButton icon="i-lucide-plus" label="New product" />
    <template #body>
      <UForm :schema="createProductInputSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Slug" name="slug">
          <UInput v-model="state.slug" class="w-full" />
        </UFormField>
        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" :rows="3" class="w-full" />
        </UFormField>
        <div class="flex justify-end">
          <UButton type="submit" :loading="pending" label="Create" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
