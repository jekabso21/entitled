<script setup lang="ts">
import type { DocPageSummary } from '@entitled/contracts/docs'
import { docPageLinkUrl } from '@entitled/markdown/doc-page-links'
import type { Editor } from '@tiptap/vue-3'

const { editor, pages, productId } = defineProps<{
  editor: Editor
  pages: readonly DocPageSummary[]
  productId: string
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const groups = computed(() => [
  {
    id: 'pages',
    items: flattenDocTree(pages).map((row) => ({
      id: row.page.id,
      label: row.page.title,
      suffix: row.page.status === 'draft' ? 'Draft' : undefined,
      icon: row.hasChildren ? 'i-lucide-folder' : 'i-lucide-file-text',
      onSelect: () => {
        insertLink(row.page)
      },
    })),
  },
])

// Links point at the page id, so renaming or moving the page never breaks them. Selected text
// becomes the link; otherwise the page title is inserted.
function insertLink(page: DocPageSummary) {
  const href = docPageLinkUrl(productId, page.id)
  const chain = editor.chain().focus()
  if (editor.state.selection.empty) {
    chain.insertContent({
      type: 'text',
      text: page.title,
      marks: [{ type: 'link', attrs: { href } }],
    })
  } else {
    chain.setLink({ href })
  }
  chain.run()
  isOpen.value = false
}
</script>

<template>
  <UModal v-model:open="isOpen" title="Link to a page" :ui="{ content: 'sm:max-w-lg' }">
    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="Find a page…"
        class="h-96"
        close
        @update:open="isOpen = $event"
      />
    </template>
  </UModal>
</template>
