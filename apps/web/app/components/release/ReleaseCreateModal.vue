<script setup lang="ts">
import type { Release } from '@entitled/contracts/releases'
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

const { productId } = defineProps<{ productId: string }>()

const schema = z.object({
  version: z.string().trim().min(1, { error: 'Enter a version' }).max(64),
  title: z.string().trim().max(200).optional(),
})
type Schema = z.output<typeof schema>

const open = ref(false)
const state = reactive<Partial<Schema>>({})
const pending = ref(false)
const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  pending.value = true
  try {
    const release = await $fetch<Release>('/api/releases', {
      method: 'POST',
      body: { productId, version: event.data.version, title: event.data.title ?? '' },
    })
    open.value = false
    await navigateTo(`/admin/releases/${release.id}`)
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
    title="New release"
    description="It starts as a draft that only your team can see. Next you attach files and choose who gets it."
  >
    <UButton icon="i-lucide-plus" label="New release" />
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Version" name="version">
          <UInput v-model="state.version" placeholder="2.4.0" class="w-full" />
        </UFormField>
        <UFormField label="Title" name="title">
          <UInput v-model="state.title" placeholder="Optional" class="w-full" />
        </UFormField>
        <div class="flex justify-end">
          <UButton type="submit" :loading="pending" label="Create draft" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
