<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'

const { editor } = defineProps<{ editor: Editor }>()

const blockPos = ref<number | null>(null)

function blockAt(pos: number | null) {
  if (pos === null) return null
  const node = editor.state.doc.nodeAt(pos)
  return node ? { node, end: pos + node.nodeSize } : null
}

// Same trick as GitBook and Notion: a new paragraph starting with "/" opens the block menu.
function addBlockBelow(pos: number | null) {
  const block = blockAt(pos)
  if (!block) return
  editor
    .chain()
    .focus()
    .insertContentAt(block.end, { type: 'paragraph', content: [{ type: 'text', text: '/' }] })
    .run()
}

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Add block below',
      icon: 'i-lucide-plus',
      onSelect: () => {
        addBlockBelow(blockPos.value)
      },
    },
    {
      label: 'Duplicate',
      icon: 'i-lucide-copy',
      onSelect: () => {
        const block = blockAt(blockPos.value)
        if (block) editor.chain().focus().insertContentAt(block.end, block.node.toJSON()).run()
      },
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        const block = blockAt(blockPos.value)
        if (block && blockPos.value !== null)
          editor.chain().focus().deleteRange({ from: blockPos.value, to: block.end }).run()
      },
    },
  ],
])

function lockHandle(isOpen: boolean) {
  editor.chain().setMeta('lockDragHandle', isOpen).run()
}
</script>

<template>
  <UEditorDragHandle
    v-slot="{ ui, onClick }"
    :editor="editor"
    @hover="blockPos = $event.pos"
    @node-change="blockPos = $event.pos"
  >
    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="ghost"
      size="sm"
      aria-label="Add block below"
      :class="ui.handle()"
      @click.stop="addBlockBelow(blockPos)"
    />
    <UDropdownMenu
      v-slot="{ open }"
      :modal="false"
      :items="items"
      :content="{ side: 'left' }"
      :ui="{ content: 'w-44' }"
      @update:open="lockHandle"
    >
      <UButton
        icon="i-lucide-grip-vertical"
        color="neutral"
        variant="ghost"
        active-variant="soft"
        size="sm"
        aria-label="Drag to move, click for options"
        :active="open"
        :class="ui.handle()"
        @click="onClick"
      />
    </UDropdownMenu>
  </UEditorDragHandle>
</template>
