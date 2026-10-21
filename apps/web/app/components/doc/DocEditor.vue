<script setup lang="ts">
import { docAssetContentTypes } from '@entitled/contracts/docs'
import { restoreAlertMarkers } from '@entitled/markdown/restore-alert-markers'
import type { EditorCustomHandlers, EditorToolbarItem } from '@nuxt/ui'
import FileHandler from '@tiptap/extension-file-handler'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import type { Editor as CoreEditor } from '@tiptap/core'
import type { Editor } from '@tiptap/vue-3'

const { productId } = defineProps<{ productId: string }>()
const markdown = defineModel<string>({ required: true })

const mode = ref<'visual' | 'source' | 'preview'>('visual')
const modes = [
  { label: 'Editor', value: 'visual', icon: 'i-lucide-pencil' },
  { label: 'Markdown', value: 'source', icon: 'i-lucide-file-code' },
  { label: 'Preview', value: 'preview', icon: 'i-lucide-eye' },
]

// The editor re-serialises Markdown as soon as it loads (realigned tables and similar).
// Only accept its output once someone actually edits in the visual tab, so opening or
// switching tabs never rewrites a page.
const touched = ref(false)
watch(mode, (value) => {
  if (value === 'visual') touched.value = false
})
const editorValue = computed({
  get: () => markdown.value,
  set: (value: string) => {
    if (mode.value === 'visual' && touched.value) markdown.value = restoreAlertMarkers(value)
  },
})

const toast = useToast()
const { upload, uploading } = useDocAssetUpload(() => productId)
const mediaInput = useTemplateRef<HTMLInputElement>('mediaInput')
let pendingEditor: CoreEditor | null = null

async function insertFiles(editor: CoreEditor, files: File[], position?: number) {
  for (const file of files) {
    try {
      const src = await upload(file)
      const image = { type: 'image', attrs: { src, alt: file.name } }
      // Videos use image syntax in Markdown; the renderer turns .mp4/.webm into players.
      if (position === undefined) editor.chain().focus().insertContent(image).run()
      else editor.chain().focus().insertContentAt(position, image).run()
    } catch (error) {
      toast.add({ title: apiErrorMessage(error, `Could not upload ${file.name}`), color: 'error' })
    }
  }
}

const extensions = [
  TableKit.configure({ table: { resizable: false } }),
  TaskList,
  TaskItem.configure({ nested: true }),
  FileHandler.configure({
    allowedMimeTypes: [...docAssetContentTypes],
    onDrop: (editor: CoreEditor, files: File[], position: number) => {
      void insertFiles(editor, files, position)
    },
    onPaste: (editor: CoreEditor, files: File[]) => {
      void insertFiles(editor, files)
    },
  }),
]

const handlers = {
  media: {
    canExecute: () => true,
    execute: (editor: Editor) => {
      pendingEditor = editor
      mediaInput.value?.click()
    },
    isActive: () => false,
  },
  table: {
    canExecute: (editor: Editor) => editor.can().insertTable({ rows: 3, cols: 3 }),
    execute: (editor: Editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    isActive: (editor: Editor) => editor.isActive('table'),
  },
} satisfies EditorCustomHandlers

const toolbar: EditorToolbarItem<typeof handlers>[][] = [
  [
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', 'aria-label': 'Heading 2' },
    { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', 'aria-label': 'Heading 3' },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', 'aria-label': 'Bold' },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', 'aria-label': 'Italic' },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', 'aria-label': 'Inline code' },
    { kind: 'link', icon: 'i-lucide-link', 'aria-label': 'Link' },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', 'aria-label': 'Bullet list' },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', 'aria-label': 'Numbered list' },
    { kind: 'taskList', icon: 'i-lucide-list-checks', 'aria-label': 'Task list' },
    { kind: 'blockquote', icon: 'i-lucide-text-quote', 'aria-label': 'Quote' },
    { kind: 'codeBlock', icon: 'i-lucide-square-code', 'aria-label': 'Code block' },
  ],
  [
    { kind: 'table', icon: 'i-lucide-table', 'aria-label': 'Insert table' },
    { kind: 'media', icon: 'i-lucide-image-plus', 'aria-label': 'Insert image or video' },
  ],
  [
    { kind: 'undo', icon: 'i-lucide-undo', 'aria-label': 'Undo' },
    { kind: 'redo', icon: 'i-lucide-redo', 'aria-label': 'Redo' },
  ],
]

function onMediaPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = ''
  if (pendingEditor && files.length) void insertFiles(pendingEditor, files)
}

const previewHtml = ref('')
const previewLoading = ref(false)
watch(mode, async (value) => {
  if (value !== 'preview') return
  previewLoading.value = true
  try {
    const result = await $fetch<{ html: string }>('/api/markdown/preview', {
      method: 'POST',
      body: { markdown: markdown.value },
    })
    previewHtml.value = result.html
  } finally {
    previewLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <UTabs v-model="mode" :items="modes" :content="false" size="sm" variant="pill" />
      <span v-if="uploading" class="flex items-center gap-2 text-sm text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" /> Uploading…
      </span>
    </div>
    <input
      ref="mediaInput"
      type="file"
      multiple
      :accept="docAssetContentTypes.join(',')"
      class="hidden"
      @change="onMediaPicked"
    />

    <div v-show="mode === 'visual'" class="rounded-md border border-default">
      <UEditor
        v-slot="{ editor }"
        v-model="editorValue"
        content-type="markdown"
        :extensions="extensions"
        :handlers="handlers"
        :on-focus="() => (touched = true)"
        placeholder="Write the page… drop images or videos anywhere."
        class="min-h-96"
        :ui="{ base: 'p-4 sm:px-8 prose prose-sm dark:prose-invert max-w-none' }"
      >
        <UEditorToolbar
          :editor="editor"
          :items="toolbar"
          class="sticky top-0 z-10 border-b border-default bg-default px-2 py-1"
        />
      </UEditor>
    </div>

    <UTextarea
      v-if="mode === 'source'"
      v-model="markdown"
      :rows="24"
      autoresize
      class="w-full font-mono"
      aria-label="Markdown source"
    />

    <div v-if="mode === 'preview'" class="min-h-96 rounded-md border border-default p-6">
      <USkeleton v-if="previewLoading" class="h-40 w-full" />
      <MarkdownContent v-else :html="previewHtml" />
    </div>
  </div>
</template>
