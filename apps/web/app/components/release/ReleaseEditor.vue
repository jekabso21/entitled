<script setup lang="ts">
import type { HardwareRevision } from '@entitled/contracts/products'
import type { Release } from '@entitled/contracts/releases'

const { release, revisions, productName } = defineProps<{
  release: Release
  revisions: HardwareRevision[]
  productName: string
}>()
const emit = defineEmits<{ saved: [] }>()

const isDraft = computed(() => release.status === 'draft')
const form = reactive({
  version: release.version,
  title: release.title,
  changelog: release.changelog,
  installInstructions: release.installInstructions,
  minRevisionId: release.minRevisionId ?? 'any',
  maxRevisionId: release.maxRevisionId ?? 'any',
  audience: release.audience,
  clientAccountIds: [...release.clientAccountIds],
})

const fromItems = computed(() => [
  { label: 'Oldest (any)', value: 'any' },
  ...revisions.map((revision) => ({
    label: `Rev ${revision.code} · ${revision.name}`,
    value: revision.id,
  })),
])
const toItems = computed(() => [
  { label: 'Newest (any)', value: 'any' },
  ...revisions.map((revision) => ({
    label: `Rev ${revision.code} · ${revision.name}`,
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
        audience: form.audience,
        clientAccountIds: form.audience === 'selected' ? form.clientAccountIds : [],
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
  <form class="divide-y divide-default" @submit.prevent="save">
    <section class="space-y-4 pb-6">
      <h2 class="font-semibold text-highlighted">Details</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          label="Version"
          :help="isDraft ? undefined : 'Fixed once published, so clients can rely on it.'"
        >
          <UInput v-model="form.version" :disabled="!isDraft" class="w-full font-mono" />
        </UFormField>
        <UFormField label="Title" help="Optional, e.g. “Spring maintenance release”">
          <UInput v-model="form.title" class="w-full" />
        </UFormField>
      </div>
    </section>

    <section class="space-y-3 py-6">
      <div>
        <h2 class="font-semibold text-highlighted">Who can download it</h2>
        <p class="text-sm text-muted">You can change this at any time, also after publishing.</p>
      </div>
      <ReleaseAudienceField
        v-model:audience="form.audience"
        v-model:client-account-ids="form.clientAccountIds"
        :product-id="release.productId"
        :product-name="productName"
      />
    </section>

    <section v-if="revisions.length" class="space-y-3 py-6">
      <div>
        <h2 class="font-semibold text-highlighted">Compatible hardware</h2>
        <p class="text-sm text-muted">
          Hardware revisions are the physical versions of {{ productName }} you have shipped (Rev A,
          Rev B …). If this firmware only runs on some of them, limit the range: clients who only
          own other revisions will not see this release.
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="From">
          <USelect
            v-model="form.minRevisionId"
            :items="fromItems"
            :disabled="!isDraft"
            class="w-full"
          />
        </UFormField>
        <UFormField label="To">
          <USelect
            v-model="form.maxRevisionId"
            :items="toItems"
            :disabled="!isDraft"
            class="w-full"
          />
        </UFormField>
      </div>
      <p v-if="!isDraft" class="text-xs text-dimmed">Fixed once published.</p>
    </section>

    <section class="space-y-4 py-6">
      <h2 class="font-semibold text-highlighted">Release notes</h2>
      <UFormField label="Changelog" help="Markdown. Clients see this above the downloads.">
        <MarkdownEditor v-model="form.changelog" :rows="10" placeholder="- Added …" />
      </UFormField>
      <UFormField label="Install instructions" help="Markdown. Shown next to the downloads.">
        <MarkdownEditor v-model="form.installInstructions" :rows="6" />
      </UFormField>
    </section>

    <div class="flex justify-end pt-6">
      <UButton type="submit" :loading="pending" icon="i-lucide-save" label="Save changes" />
    </div>
  </form>
</template>
