<script setup lang="ts">
import { type DocPageSummary, MAX_DOC_PAGE_DEPTH } from '@entitled/contracts/docs'
import {
  groupUnderTitle,
  type HeadingLevel,
  splitMarkdownIntoPages,
  suggestSplit,
} from '@entitled/markdown/split-markdown-pages'

const {
  productId,
  parent = null,
  label = 'Import',
} = defineProps<{
  productId: string
  // Set when importing from inside a page: the document can become its sub-pages or be
  // inserted into the page itself.
  parent?: { id: string; title: string; depth: number } | null
  label?: string
}>()
const emit = defineEmits<{ imported: [pages: DocPageSummary[]]; insert: [markdown: string] }>()

const open = ref(false)
const files = ref<File[]>([])
const source = ref<DocImportSource | null>(null)
const reading = ref(false)
const readError = ref('')
const progress = ref('')
const splitKey = ref('none')
const target = ref<'pages' | 'insert'>('pages')
const isPublished = ref(false)
const shouldAttachOriginal = ref(true)
const isGrouped = ref(true)
const importing = ref(false)
const toast = useToast()
const { status, insertMarkdown, importPages } = useDocImport(() => productId)

const roomForLevels = computed(() => MAX_DOC_PAGE_DEPTH - (parent ? parent.depth + 1 : 0))
const canCreatePages = computed(() => roomForLevels.value > 0)

const splitItems = computed(() =>
  docSplitOptions(source.value?.markdown ?? '', roomForLevels.value),
)

const split = computed<{ pageLevel: HeadingLevel | null; subPageLevel: HeadingLevel | null }>(
  () => {
    const [page, sub] = splitKey.value.split('-').map(Number)
    const asLevel = (value: number | undefined) =>
      value === 1 || value === 2 || value === 3 ? value : null
    return { pageLevel: asLevel(page), subPageLevel: asLevel(sub) }
  },
)

const preview = computed(() =>
  source.value
    ? splitMarkdownIntoPages(source.value.markdown, {
        ...split.value,
        fallbackTitle: source.value.title,
      })
    : [],
)
const canGroup = computed(() => {
  const deepest = Math.max(0, ...preview.value.map((page) => page.depth))
  return preview.value.length > 1 && deepest + 2 <= roomForLevels.value
})
const pagesToCreate = computed(() =>
  source.value && isGrouped.value && canGroup.value
    ? groupUnderTitle(preview.value, source.value.title)
    : preview.value,
)
const assetCount = computed(() => {
  const markdown = source.value?.markdown ?? ''
  return [...(source.value?.assets.keys() ?? [])].filter((ref) => markdown.includes(`(${ref}`))
    .length
})
const countAssets = (body: string) => (body.match(/\(asset:\d+\)/g) ?? []).length

watch(files, async (picked) => {
  source.value = null
  readError.value = ''
  if (picked.length === 0) return
  reading.value = true
  try {
    source.value = await readDocImportFiles(picked, (message) => (progress.value = message))
    const suggested = suggestSplit(source.value.markdown)
    const key =
      suggested.pageLevel === null
        ? 'none'
        : [suggested.pageLevel, suggested.subPageLevel].filter(Boolean).join('-')
    splitKey.value = splitItems.value.some((item) => item.value === key)
      ? key
      : (splitItems.value[1]?.value ?? 'none')
    target.value = canCreatePages.value ? 'pages' : 'insert'
  } catch (error) {
    readError.value = error instanceof Error ? error.message : 'Could not read these files'
  } finally {
    reading.value = false
  }
})

function reset() {
  files.value = []
  source.value = null
  readError.value = ''
}

async function runImport() {
  if (!source.value) return
  importing.value = true
  try {
    if (target.value === 'insert') {
      emit('insert', await insertMarkdown(source.value))
    } else {
      const pages = await importPages(source.value, pagesToCreate.value, {
        parentId: parent?.id ?? null,
        isPublished: isPublished.value,
        shouldAttachOriginal: shouldAttachOriginal.value && source.value.kind === 'pdf',
      })
      toast.add({ title: `Imported ${String(pages.length)} pages`, color: 'success' })
      emit('imported', pages)
    }
    open.value = false
    reset()
  } catch (error) {
    toast.add({ title: apiErrorMessage(error, 'Import failed'), color: 'error' })
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Import a document"
    description="Markdown (.md), a .zip with Markdown and its images, or a PDF. You check the result before anything is created."
    :ui="{ content: 'sm:max-w-2xl' }"
    @after:leave="reset"
  >
    <UButton icon="i-lucide-file-up" color="neutral" variant="outline" :label="label" />
    <template #body>
      <div class="space-y-5">
        <UFileUpload
          v-if="!source"
          v-model="files"
          multiple
          accept=".md,.markdown,.pdf,.zip,image/*"
          label="Drop a .md, .zip or .pdf here"
          description="Select a .md together with its images, or a .zip that contains both."
          icon="i-lucide-file-text"
          :disabled="reading"
          class="min-h-44 w-full"
        />
        <p v-if="reading" class="flex items-center gap-2 text-sm text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
          {{ progress || 'Reading…' }}
        </p>
        <UAlert
          v-if="readError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="readError"
        />

        <template v-if="source">
          <div class="flex items-center justify-between gap-3 border border-default p-3">
            <div class="min-w-0">
              <p class="truncate font-medium text-highlighted">{{ source.title }}</p>
              <p class="text-xs text-dimmed">
                {{ source.kind === 'pdf' ? 'Converted from PDF' : 'Markdown' }} · {{ assetCount }}
                {{ assetCount === 1 ? 'file' : 'images and files' }}
              </p>
            </div>
            <UButton label="Choose other files" variant="link" color="neutral" @click="reset" />
          </div>

          <URadioGroup
            v-if="parent && canCreatePages"
            v-model="target"
            variant="card"
            :items="[
              {
                value: 'pages',
                label: 'Create sub-pages',
                description: `New pages under “${parent.title}”`,
              },
              {
                value: 'insert',
                label: 'Insert into this page',
                description: 'Adds everything at the end of the page',
              },
            ]"
            :ui="{ fieldset: 'grid gap-3 sm:grid-cols-2' }"
          />

          <template v-if="target === 'pages'">
            <UFormField label="How to split it into pages">
              <USelect v-model="splitKey" :items="splitItems" class="w-full" />
            </UFormField>
            <div>
              <p class="mb-2 text-sm font-medium text-highlighted">
                {{ pagesToCreate.length }}
                {{ pagesToCreate.length === 1 ? 'page' : 'pages' }} will be created
              </p>
              <ol class="max-h-64 divide-y divide-default overflow-y-auto border border-default">
                <li
                  v-for="(page, index) in pagesToCreate"
                  :key="index"
                  class="flex items-center gap-2 px-3 py-2 text-sm"
                  :style="{ paddingLeft: `${String(0.75 + page.depth * 1.25)}rem` }"
                >
                  <UIcon
                    :name="page.depth ? 'i-lucide-corner-down-right' : 'i-lucide-file-text'"
                    class="size-4 shrink-0 text-dimmed"
                  />
                  <span class="min-w-0 flex-1 truncate text-default">{{ page.title }}</span>
                  <span
                    v-if="countAssets(page.body)"
                    class="flex items-center gap-1 text-xs text-dimmed"
                  >
                    <UIcon name="i-lucide-image" class="size-3.5" /> {{ countAssets(page.body) }}
                  </span>
                </li>
              </ol>
            </div>
            <div class="space-y-2">
              <UCheckbox
                v-if="canGroup"
                v-model="isGrouped"
                :label="`Keep it together as one section, “${source.title}”`"
                description="The pages are nested under a section page in the page list."
              />
              <UCheckbox
                v-model="isPublished"
                label="Publish right away"
                description="Otherwise the pages start as drafts only your team sees."
              />
              <UCheckbox
                v-if="source.kind === 'pdf'"
                v-model="shouldAttachOriginal"
                label="Attach the original PDF"
                description="Clients can download it from the first page."
              />
            </div>
          </template>

          <UAlert
            v-if="source.kind === 'pdf'"
            color="neutral"
            variant="subtle"
            icon="i-lucide-info"
            title="Check the converted text"
            description="Headings, lists, images and code come across. Tables and multi-column layouts arrive as plain text and may need tidying."
          />
          <UAlert
            v-if="source.missing.length"
            color="warning"
            variant="subtle"
            icon="i-lucide-image-off"
            :title="`${String(source.missing.length)} referenced files were not found`"
            :description="`${source.missing.slice(0, 5).join(', ')}${source.missing.length > 5 ? ' …' : ''}. Import a .zip with the files, or select them together with the .md.`"
          />
        </template>
      </div>
    </template>
    <template v-if="source" #footer>
      <div class="flex w-full items-center justify-end gap-3">
        <span v-if="importing" class="mr-auto text-sm text-muted">{{ status }}</span>
        <UButton label="Cancel" color="neutral" variant="ghost" @click="open = false" />
        <UButton
          :loading="importing"
          icon="i-lucide-file-check"
          :label="
            target === 'insert'
              ? 'Insert into page'
              : `Import ${String(pagesToCreate.length)} pages`
          "
          @click="runImport"
        />
      </div>
    </template>
  </UModal>
</template>
