<script setup lang="ts">
// The HTML is rendered and sanitised by the API; only mermaid diagrams are drawn here.
const { html, size = 'sm' } = defineProps<{ html: string; size?: 'sm' | 'base' }>()

const container = useTemplateRef<HTMLElement>('container')
const colorMode = useColorMode()

async function drawDiagrams() {
  const blocks = container.value?.querySelectorAll<HTMLElement>('pre.mermaid')
  if (!blocks?.length) return
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: colorMode.value === 'dark' ? 'dark' : 'default',
  })
  await mermaid.run({ nodes: [...blocks] })
}

// Links to other portal pages navigate inside the app instead of reloading it.
function onClick(event: MouseEvent) {
  onDocTabClick(event)
  const link = event.target instanceof Element ? event.target.closest('a') : null
  const href = link?.getAttribute('href') ?? ''
  if (!href.startsWith('/') || href.startsWith('/api/') || href.startsWith('//')) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
  event.preventDefault()
  void navigateTo(href)
}

onMounted(drawDiagrams)
watch(
  () => html,
  () => nextTick(drawDiagrams),
)
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- sanitised server-side by @entitled/markdown -->
  <div
    ref="container"
    class="prose max-w-none dark:prose-invert"
    :class="size === 'sm' && 'prose-sm'"
    @click="onClick"
    @keydown="onDocTabKey"
    v-html="html"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
