<script setup lang="ts">
import {
  docAssetContentTypes,
  docMediaContentTypes,
  type DocPageSummary,
} from '@entitled/contracts/docs'
import { restoreAlertMarkers } from '@entitled/markdown/restore-alert-markers'
import FileHandler from '@tiptap/extension-file-handler'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Mathematics } from '@tiptap/extension-mathematics'
import { TableKit } from '@tiptap/extension-table'
import type { Editor as CoreEditor } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'

const { productId, pages = [] } = defineProps<{
  productId: string
  pages?: readonly DocPageSummary[]
}>()
const markdown = defineModel<string>({ required: true })

const mode = defineModel<DocEditorMode>('mode', { default: 'visual' })

// The editor re-serialises Markdown as soon as it loads (realigned tables and similar).
// Only accept its output once someone clicks, types or drops into the visual tab, so opening
// or switching tabs never rewrites a page.
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
const attachmentInput = useTemplateRef<HTMLInputElement>('attachmentInput')
let pendingEditor: CoreEditor | null = null
const mediaTypes: readonly string[] = docMediaContentTypes

function nodeFor(file: File, src: string) {
  // Videos use image syntax in Markdown; the renderer turns .mp4/.webm into players.
  if (mediaTypes.includes(file.type)) return { type: 'image', attrs: { src, alt: file.name } }
  return {
    type: 'paragraph',
    content: [{ type: 'text', text: file.name, marks: [{ type: 'link', attrs: { href: src } }] }],
  }
}

async function insertFiles(editor: CoreEditor, picked: File[], position?: number) {
  for (const original of picked) {
    const file = withUploadType(original)
    try {
      const node = nodeFor(file, await upload(file))
      if (position === undefined) editor.chain().focus().insertContent(node).run()
      else editor.chain().focus().insertContentAt(position, node).run()
    } catch (error) {
      toast.add({ title: apiErrorMessage(error, `Could not upload ${file.name}`), color: 'error' })
    }
  }
}

const mathTarget = ref<MathTarget | null>(null)
const isPageLinkOpen = ref(false)

function editMathNode(kind: MathTarget['kind']) {
  return (node: PmNode, pos: number) => {
    const latex: unknown = node.attrs.latex
    mathTarget.value = { kind, latex: typeof latex === 'string' ? latex : '', pos }
  }
}

const extensions = [
  TableKit.configure({ table: { resizable: false } }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Mathematics.configure({
    katexOptions: { throwOnError: false },
    blockOptions: { onClick: editMathNode('block') },
    inlineOptions: { onClick: editMathNode('inline') },
  }),
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

const handlers = useDocEditorHandlers({
  pickFiles: (editor, kind) => {
    pendingEditor = editor
    ;(kind === 'media' ? mediaInput : attachmentInput).value?.click()
  },
  editMath: (target) => {
    mathTarget.value = target
  },
  linkPage: () => {
    isPageLinkOpen.value = true
  },
})

function onMediaPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = ''
  if (pendingEditor && files.length) void insertFiles(pendingEditor, files)
}

const editorBase = [
  'min-h-[60vh] pb-[30vh] text-base sm:px-0',
  '[&_.tableWrapper]:overflow-x-auto [&_table]:w-full [&_table]:border-collapse',
  '[&_:is(td,th)]:border [&_:is(td,th)]:border-default [&_:is(td,th)]:px-3 [&_:is(td,th)]:py-2',
  '[&_th]:bg-muted [&_th]:text-left [&_th]:font-semibold [&_:is(td,th)>p]:my-0',
  '[&_ul[data-type=taskList]]:ps-0 [&_ul[data-type=taskList]]:list-none',
  '[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:gap-2',
  '[&_[data-type=block-math]]:cursor-pointer [&_[data-type=block-math]]:overflow-x-auto [&_[data-type=block-math]]:py-2',
  '[&_[data-type=inline-math]]:cursor-pointer',
]

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
  <div>
    <input
      ref="mediaInput"
      type="file"
      multiple
      :accept="docMediaContentTypes.join(',')"
      class="hidden"
      @change="onMediaPicked"
    />
    <input ref="attachmentInput" type="file" multiple class="hidden" @change="onMediaPicked" />

    <div
      v-show="mode === 'visual'"
      @pointerdown.capture="touched = true"
      @keydown.capture="touched = true"
      @drop.capture="touched = true"
    >
      <UEditor
        v-slot="{ editor }"
        v-model="editorValue"
        content-type="markdown"
        :extensions="extensions"
        :handlers="handlers"
        placeholder="Type / for blocks, or drop images, videos and files here…"
        :ui="{ base: editorBase }"
      >
        <UEditorToolbar
          :editor="editor"
          :items="docEditorToolbar"
          class="sticky top-0 z-10 -mx-2 mb-6 overflow-x-auto border-b border-default bg-default/95 px-1 py-1.5 backdrop-blur"
        />
        <UEditorToolbar :editor="editor" :items="docEditorBubble" layout="bubble" />
        <UEditorSuggestionMenu :editor="editor" :items="docEditorSlashMenu" />
        <DocEditorBlockHandle :editor="editor" />
        <DocMathModal v-model="mathTarget" :editor="editor" />
        <DocPageLinkModal
          v-model:open="isPageLinkOpen"
          :editor="editor"
          :pages="pages"
          :product-id="productId"
        />
        <span
          v-if="uploading"
          class="fixed right-6 bottom-6 z-20 flex items-center gap-2 border border-default bg-default px-3 py-2 text-sm text-muted shadow-sm"
        >
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" /> Uploading…
        </span>
      </UEditor>
    </div>

    <UTextarea
      v-if="mode === 'source'"
      v-model="markdown"
      :rows="30"
      autoresize
      variant="none"
      class="w-full"
      :ui="{ base: 'min-h-[70vh] p-0 font-mono text-sm leading-6' }"
      aria-label="Markdown source"
    />

    <div v-if="mode === 'preview'" class="min-h-[60vh]">
      <USkeleton v-if="previewLoading" class="h-40 w-full" />
      <MarkdownContent v-else :html="previewHtml" size="base" />
    </div>
  </div>
</template>
