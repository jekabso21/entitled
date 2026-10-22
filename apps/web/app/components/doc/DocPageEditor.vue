<script setup lang="ts">
import type { DocPage, DocPageSummary } from '@entitled/contracts/docs'

const { pageId, productId, depth, subPageCount, pages } = defineProps<{
  pageId: string
  productId: string
  depth: number
  subPageCount: number
  pages: readonly DocPageSummary[]
}>()
const emit = defineEmits<{ changed: []; deleted: [] }>()

const toast = useToast()
const { data: page, refresh } = await useFetch<DocPage>(() => `/api/docs/${pageId}`, {
  key: `doc-${pageId}`,
})

const fields = ['title', 'slug', 'description', 'body'] as const
const pick = (value: Pick<DocPage, (typeof fields)[number]>) => ({
  title: value.title,
  slug: value.slug,
  description: value.description,
  body: value.body,
})
const form = reactive({ title: '', slug: '', description: '', body: '' })
const saved = ref({ ...form })
watch(
  page,
  (value) => {
    if (!value) return
    Object.assign(form, pick(value))
    saved.value = pick(value)
  },
  { immediate: true },
)
const dirty = computed(() => fields.some((field) => form[field] !== saved.value[field]))

const confirmLeave = () =>
  !dirty.value || window.confirm('You have unsaved changes. Leave this page anyway?')
onBeforeRouteLeave(confirmLeave)
onBeforeRouteUpdate(confirmLeave)

const saving = ref(false)
async function save(extra: { status?: 'draft' | 'published' } = {}) {
  saving.value = true
  try {
    await $fetch(`/api/docs/${pageId}`, {
      method: 'PATCH',
      body: { ...pick(form), ...extra },
    })
    await refresh()
    emit('changed')
    const titles = { published: 'Page published', draft: 'Page moved back to draft' }
    toast.add({ title: extra.status ? titles[extra.status] : 'Page saved', color: 'success' })
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    saving.value = false
  }
}

const isDeleteOpen = ref(false)
async function remove() {
  await $fetch(`/api/docs/${pageId}`, { method: 'DELETE' })
  saved.value = { ...form }
  isDeleteOpen.value = false
  emit('deleted')
}

function insertImported(markdown: string) {
  form.body = `${form.body.trimEnd()}\n\n${markdown.trim()}\n`
  toast.add({ title: 'Inserted at the end of the page. Save to keep it.', color: 'info' })
}

function onImported(_pages: DocPageSummary[]) {
  emit('changed')
}

const isHistoryOpen = ref(false)
const { data: user } = useCurrentUser()
const canRestore = computed(() => ['admin', 'editor'].includes(user.value?.vendorRole ?? ''))

const mode = ref<DocEditorMode>('visual')
const isFocusMode = ref(false)
defineShortcuts({
  meta_s: {
    usingInput: true,
    handler: () => {
      if (dirty.value && !saving.value) void save()
    },
  },
  escape: () => (isFocusMode.value = false),
})
</script>

<template>
  <div
    v-if="page"
    class="flex min-h-0 min-w-0 flex-1 flex-col bg-default"
    :class="isFocusMode && 'fixed inset-0 z-50'"
  >
    <div
      class="flex items-center gap-2 overflow-x-auto border-b border-default bg-default px-4 py-2 sm:px-6"
    >
      <UButton
        :icon="isFocusMode ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
        variant="ghost"
        color="neutral"
        :aria-label="isFocusMode ? 'Exit full screen' : 'Full screen'"
        @click="isFocusMode = !isFocusMode"
      />
      <UTabs
        v-model="mode"
        :items="docEditorModes"
        :content="false"
        size="xs"
        variant="pill"
        color="neutral"
      />
      <StatusBadge
        :color="page.status === 'published' ? 'success' : 'warning'"
        :label="page.status === 'published' ? 'Published' : 'Draft'"
      />
      <UBadge
        v-if="dirty"
        variant="outline"
        color="neutral"
        label="Unsaved changes"
        class="shrink-0"
      />
      <div class="ml-auto flex shrink-0 items-center gap-1.5">
        <DocImportModal
          :product-id="productId"
          :parent="{ id: page.id, title: page.title, depth }"
          label="Import"
          @imported="onImported"
          @insert="insertImported"
        />
        <UButton
          icon="i-lucide-history"
          variant="ghost"
          color="neutral"
          label="History"
          @click="isHistoryOpen = true"
        />
        <UButton
          :to="`/api/docs/${page.id}/export`"
          external
          icon="i-lucide-download"
          variant="ghost"
          color="neutral"
          aria-label="Export as Markdown"
        />
        <UButton
          icon="i-lucide-trash-2"
          variant="ghost"
          color="error"
          aria-label="Delete page"
          @click="isDeleteOpen = true"
        />
        <UButton
          variant="outline"
          color="neutral"
          :loading="saving"
          :disabled="!dirty"
          label="Save"
          @click="save()"
        />
        <UButton
          v-if="page.status === 'draft'"
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
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <article class="mx-auto w-full max-w-6xl px-4 pt-8 sm:pt-10 sm:pr-8 sm:pl-14">
        <input
          v-model="form.title"
          aria-label="Title"
          placeholder="Page title"
          class="w-full bg-transparent text-3xl font-bold tracking-tight text-highlighted outline-none placeholder:text-dimmed sm:text-4xl"
        />
        <input
          v-model="form.description"
          aria-label="Description"
          maxlength="300"
          placeholder="Add a short description, shown in page lists and search results"
          class="mt-2 w-full bg-transparent text-lg text-muted outline-none placeholder:text-dimmed"
        />
        <div class="mt-3 mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-dimmed">
          <UIcon name="i-lucide-link" class="size-3.5" />
          <label for="doc-slug">Address</label>
          <UInput
            id="doc-slug"
            v-model="form.slug"
            aria-label="Slug"
            size="xs"
            variant="ghost"
            class="w-64 font-mono"
          />
          <span v-if="subPageCount" class="ml-auto text-xs">
            {{ subPageCount }} {{ subPageCount === 1 ? 'sub-page' : 'sub-pages' }}
          </span>
        </div>
        <DocLinkWarnings :body="form.body" :pages="pages" :product-id="productId" />
        <DocEditor v-model="form.body" v-model:mode="mode" :product-id="productId" :pages="pages" />
      </article>
    </div>

    <DocDeleteModal
      v-model:open="isDeleteOpen"
      :title="page.title"
      :sub-page-count="subPageCount"
      @confirm="remove"
    />
    <DocHistorySlideover
      v-model:open="isHistoryOpen"
      :page-id="page.id"
      :current="saved"
      :can-restore="canRestore"
      @restored="refresh"
    />
  </div>
</template>
