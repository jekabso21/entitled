<script setup lang="ts">
// The HTML is rendered and sanitised by the API; only mermaid diagrams are drawn here.
const { html } = defineProps<{ html: string }>()

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

onMounted(drawDiagrams)
watch(
  () => html,
  () => nextTick(drawDiagrams),
)
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- sanitised server-side by @entitled/markdown -->
  <div ref="container" class="prose prose-sm max-w-none dark:prose-invert" v-html="html" />
</template>
