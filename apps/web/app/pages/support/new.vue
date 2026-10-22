<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'
import type { Release } from '@entitled/contracts/releases'
import type { SupportThread } from '@entitled/contracts/support'

definePageMeta({ layout: 'client' })

const route = useRoute()
const { data: user } = useCurrentUser()
const { data: products } = await useFetch<Product[]>('/api/products', {
  key: 'products',
  default: () => [],
})

const form = reactive({
  clientAccountId: user.value?.memberships[0]?.clientAccountId,
  productId: typeof route.query.product === 'string' ? route.query.product : undefined,
  releaseId: undefined as string | undefined,
  subject: '',
  body: '',
})

const { data: releases } = await useFetch<Release[]>(
  () => `/api/products/${form.productId ?? 'none'}/releases`,
  {
    key: `releases-${form.productId ?? 'none'}`,
    default: () => [],
    immediate: Boolean(form.productId),
  },
)
watch(
  () => form.productId,
  () => {
    form.releaseId = undefined
  },
)

const accountItems = computed(
  () =>
    user.value?.memberships.map((membership) => ({
      label: membership.clientAccountName,
      value: membership.clientAccountId,
    })) ?? [],
)
const productItems = computed(() =>
  products.value.map((product) => ({ label: product.name, value: product.id })),
)
const releaseItems = computed(() =>
  releases.value.map((release) => ({ label: release.version, value: release.id })),
)

const pending = ref(false)
const toast = useToast()
const { attachments, uploading, add, remove } = useSupportAttachments()

async function addFiles(files: File[]) {
  try {
    await add(files)
  } catch (error) {
    toast.add({ title: apiErrorMessage(error, 'Upload failed'), color: 'error' })
  }
}

async function submit() {
  pending.value = true
  try {
    const thread = await $fetch<SupportThread>('/api/support/threads', {
      method: 'POST',
      body: {
        clientAccountId: form.clientAccountId,
        productId: form.productId,
        releaseId: form.releaseId ?? null,
        subject: form.subject,
        body: form.body,
        attachmentIds: attachments.value.map((attachment) => attachment.id),
      },
    })
    await navigateTo(`/support/${thread.id}`)
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    pending.value = false
  }
}

useSeoMeta({ title: 'New support request' })
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <PageHeader
      title="New support request"
      description="Tell the support team what happened. Add logs or photos if you have them."
      :breadcrumbs="[{ label: 'Support', to: '/support' }, { label: 'New request' }]"
    />
    <UCard>
      <form class="space-y-4" @submit.prevent="submit">
        <UFormField v-if="accountItems.length > 1" label="Client account">
          <USelect v-model="form.clientAccountId" :items="accountItems" class="w-full" />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Product">
            <USelect
              v-model="form.productId"
              :items="productItems"
              placeholder="Choose a product"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Version" help="Optional: the release you are running">
            <USelect
              v-model="form.releaseId"
              :items="releaseItems"
              :disabled="releaseItems.length === 0"
              placeholder="Not sure"
              class="w-full"
            />
          </UFormField>
        </div>
        <UFormField label="Subject" help="One line, e.g. “CAN bus drops after updating to 2.4.1”">
          <UInput v-model="form.subject" class="w-full" />
        </UFormField>
        <UFormField label="Describe the problem">
          <MarkdownEditor v-model="form.body" :rows="8" />
        </UFormField>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
          <SupportAttachmentPicker
            :attachments="attachments"
            :uploading="uploading"
            @add="addFiles"
            @remove="remove"
          />
          <UButton
            type="submit"
            :loading="pending"
            :disabled="
              !form.productId || form.subject.trim().length < 3 || !form.body.trim() || uploading
            "
            label="Send request"
          />
        </div>
      </form>
    </UCard>
  </div>
</template>
