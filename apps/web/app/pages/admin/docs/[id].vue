<script setup lang="ts">
import type { DocPage } from '@entitled/contracts/docs'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const pageId = computed(() => String(route.params.id))
const toast = useToast()

const { data: page, refresh } = await useFetch<DocPage>(() => `/api/docs/${pageId.value}`, {
  key: `doc-${pageId.value}`,
})

const form = reactive({ title: '', slug: '', body: '' })
const saved = ref({ title: '', slug: '', body: '' })
watch(
  page,
  (value) => {
    if (!value) return
    Object.assign(form, { title: value.title, slug: value.slug, body: value.body })
    saved.value = { title: value.title, slug: value.slug, body: value.body }
  },
  { immediate: true },
)
const dirty = computed(
  () =>
    form.title !== saved.value.title ||
    form.slug !== saved.value.slug ||
    form.body !== saved.value.body,
)

const saving = ref(false)
async function save(extra: { status?: 'draft' | 'published' } = {}) {
  saving.value = true
  try {
    await $fetch(`/api/docs/${pageId.value}`, {
      method: 'PATCH',
      body: { title: form.title, slug: form.slug, body: form.body, ...extra },
    })
    await refresh()
    toast.add({
      title: extra.status === 'published' ? 'Page published' : 'Page saved',
      color: 'success',
    })
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!page.value) return
  const productId = page.value.productId
  await $fetch(`/api/docs/${pageId.value}`, { method: 'DELETE' })
  await navigateTo(`/admin/products/${productId}`)
}

useSeoMeta({ title: () => page.value?.title ?? 'Doc page' })
</script>

<template>
  <UDashboardPanel id="doc-page">
    <template #header>
      <UDashboardNavbar :title="page?.title ?? 'Doc page'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            :to="page ? `/admin/products/${page.productId}` : '/admin/products'"
          />
        </template>
        <template #trailing>
          <UBadge
            v-if="page"
            variant="subtle"
            :color="page.status === 'published' ? 'success' : 'warning'"
            :label="page.status"
          />
          <UBadge v-if="dirty" variant="outline" color="neutral" label="Unsaved" />
        </template>
        <template #right>
          <UButton
            v-if="page"
            :to="`/api/docs/${page.id}/export`"
            external
            icon="i-lucide-download"
            variant="ghost"
            color="neutral"
            label="Export .md"
          />
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            aria-label="Delete page"
            @click="remove"
          />
          <UButton
            variant="outline"
            :loading="saving"
            :disabled="!dirty"
            label="Save"
            @click="save()"
          />
          <UButton
            v-if="page?.status === 'draft'"
            icon="i-lucide-send"
            :loading="saving"
            label="Publish"
            @click="save({ status: 'published' })"
          />
          <UButton
            v-else
            variant="soft"
            color="neutral"
            :loading="saving"
            label="Unpublish"
            @click="save({ status: 'draft' })"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div v-if="page" class="mx-auto w-full max-w-5xl space-y-4">
        <div class="grid gap-4 sm:grid-cols-3">
          <UFormField label="Title" class="sm:col-span-2">
            <UInput v-model="form.title" class="w-full" />
          </UFormField>
          <UFormField label="Slug">
            <UInput v-model="form.slug" class="w-full" />
          </UFormField>
        </div>
        <DocEditor v-model="form.body" :product-id="page.productId" />
      </div>
    </template>
  </UDashboardPanel>
</template>
