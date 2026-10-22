<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import katex from 'katex'

const { editor } = defineProps<{ editor: Editor }>()
const target = defineModel<MathTarget | null>({ required: true })

const latex = ref('')
watch(target, (value) => {
  if (value) latex.value = value.latex
})

const isOpen = computed({
  get: () => target.value !== null,
  set: (value: boolean) => {
    if (!value) target.value = null
  },
})
const isBlock = computed(() => target.value?.kind === 'block')
const isEditing = computed(() => target.value?.pos !== undefined)

// KaTeX with trust off renders only math markup, never links or HTML from the input.
const previewHtml = computed(() =>
  katex.renderToString(latex.value || '\\ldots', {
    displayMode: isBlock.value,
    throwOnError: false,
  }),
)

function save() {
  const current = target.value
  const value = latex.value.trim()
  if (!current || !value) return
  const chain = editor.chain().focus()
  const pos = current.pos
  if (current.kind === 'block') {
    if (pos === undefined) chain.insertBlockMath({ latex: value }).run()
    else chain.updateBlockMath({ latex: value, pos }).run()
  } else if (pos === undefined) {
    chain.insertInlineMath({ latex: value }).run()
  } else {
    chain.updateInlineMath({ latex: value, pos }).run()
  }
  target.value = null
}

function remove() {
  const pos = target.value?.pos
  if (pos === undefined) return
  const chain = editor.chain().focus()
  if (isBlock.value) chain.deleteBlockMath({ pos }).run()
  else chain.deleteInlineMath({ pos }).run()
  target.value = null
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isBlock ? 'Formula' : 'Inline formula'"
    description="Write LaTeX, for example I = \frac{P}{V}."
  >
    <template #body>
      <div class="space-y-4">
        <UTextarea
          v-model="latex"
          autofocus
          :rows="isBlock ? 4 : 2"
          autoresize
          class="w-full font-mono"
          aria-label="LaTeX"
          placeholder="E = mc^2"
          @keydown.meta.enter="save"
          @keydown.ctrl.enter="save"
        />
        <!-- eslint-disable-next-line vue/no-v-html -- KaTeX output with trust disabled -->
        <div class="overflow-x-auto border border-default bg-muted p-4" v-html="previewHtml" />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full items-center gap-2">
        <UButton
          v-if="isEditing"
          label="Remove"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          @click="remove"
        />
        <UButton
          class="ml-auto"
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="target = null"
        />
        <UButton :label="isEditing ? 'Update' : 'Insert'" :disabled="!latex.trim()" @click="save" />
      </div>
    </template>
  </UModal>
</template>
