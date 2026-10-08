<script setup lang="ts">
import type { MarkdownPreview } from '@entitled/contracts/markdown'

const { rows = 10, placeholder = '' } = defineProps<{ rows?: number; placeholder?: string }>()
const markdown = defineModel<string>({ required: true })

const tab = ref<'write' | 'preview'>('write')
const previewHtml = ref('')
const loading = ref(false)

watch(tab, async (value) => {
  if (value !== 'preview') return
  loading.value = true
  try {
    const result = await $fetch<MarkdownPreview>('/api/markdown/preview', {
      method: 'POST',
      body: { markdown: markdown.value },
    })
    previewHtml.value = result.html
  } finally {
    loading.value = false
  }
})

const tabs = [
  { label: 'Write', value: 'write' },
  { label: 'Preview', value: 'preview' },
]
</script>

<template>
  <div class="space-y-2">
    <UTabs v-model="tab" :items="tabs" :content="false" size="xs" variant="link" />
    <UTextarea
      v-if="tab === 'write'"
      v-model="markdown"
      :rows="rows"
      :placeholder="placeholder"
      autoresize
      class="w-full font-mono"
    />
    <div v-else class="min-h-24 rounded-md border border-default p-4">
      <USkeleton v-if="loading" class="h-20 w-full" />
      <MarkdownContent v-else-if="previewHtml" :html="previewHtml" />
      <p v-else class="text-sm text-muted">Nothing to preview.</p>
    </div>
  </div>
</template>
