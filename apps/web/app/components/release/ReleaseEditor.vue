<script setup lang="ts">
import type { HardwareRevision } from '@entitled/contracts/products'
import type { Release } from '@entitled/contracts/releases'

const { release, revisions } = defineProps<{ release: Release; revisions: HardwareRevision[] }>()
const emit = defineEmits<{ saved: [] }>()

const isDraft = computed(() => release.status === 'draft')
const form = reactive({
  version: release.version,
  title: release.title,
  changelog: release.changelog,
  installInstructions: release.installInstructions,
  minRevisionId: release.minRevisionId ?? 'any',
  maxRevisionId: release.maxRevisionId ?? 'any',
})

const revisionItems = computed(() => [
  { label: 'Open', value: 'any' },
  ...revisions.map((revision) => ({
    label: `${revision.code} · ${revision.name}`,
    value: revision.id,
  })),
])

const pending = ref(false)
const toast = useToast()

async function save() {
  pending.value = true
  const target = isDraft.value
    ? {
        version: form.version,
        minRevisionId: form.minRevisionId === 'any' ? null : form.minRevisionId,
        maxRevisionId: form.maxRevisionId === 'any' ? null : form.maxRevisionId,
      }
    : {}
  try {
    await $fetch(`/api/releases/${release.id}`, {
      method: 'PATCH',
      body: {
        ...target,
        title: form.title,
        changelog: form.changelog,
        installInstructions: form.installInstructions,
      },
    })
    toast.add({ title: 'Release saved', color: 'success' })
    emit('saved')
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="save">
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Version">
        <UInput v-model="form.version" :disabled="!isDraft" class="w-full" />
      </UFormField>
      <UFormField label="Title">
        <UInput v-model="form.title" class="w-full" />
      </UFormField>
      <UFormField label="From revision" help="Oldest hardware revision this release supports">
        <USelect
          v-model="form.minRevisionId"
          :items="revisionItems"
          :disabled="!isDraft"
          class="w-full"
        />
      </UFormField>
      <UFormField label="To revision" help="Newest hardware revision this release supports">
        <USelect
          v-model="form.maxRevisionId"
          :items="revisionItems"
          :disabled="!isDraft"
          class="w-full"
        />
      </UFormField>
    </div>
    <UFormField label="Changelog" help="Markdown, shown to clients">
      <MarkdownEditor v-model="form.changelog" :rows="10" placeholder="- Added …" />
    </UFormField>
    <UFormField label="Install instructions" help="Markdown, shown next to the downloads">
      <MarkdownEditor v-model="form.installInstructions" :rows="6" />
    </UFormField>
    <div class="flex justify-end">
      <UButton type="submit" :loading="pending" label="Save" />
    </div>
  </form>
</template>
