<script setup lang="ts">
import type { DocHeading } from '@entitled/contracts/docs'

const { headings } = defineProps<{ headings: readonly DocHeading[] }>()

const activeId = ref<string | null>(null)
let observer: IntersectionObserver | undefined

// Highlights the section nearest the top of the screen while reading.
function observe() {
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
      const first = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (first) activeId.value = first.target.id
    },
    { rootMargin: '-80px 0px -70% 0px' },
  )
  for (const heading of headings) {
    const element = document.getElementById(heading.id)
    if (element) observer.observe(element)
  }
}

onMounted(observe)
watch(
  () => headings,
  () => nextTick(observe),
)
onBeforeUnmount(() => observer?.disconnect())

const minDepth = computed(() => Math.min(...headings.map((heading) => heading.depth)))
</script>

<template>
  <nav v-if="headings.length > 1" aria-label="On this page">
    <p class="mb-2 text-xs font-medium text-dimmed">On this page</p>
    <ul class="space-y-1 border-l border-default">
      <li v-for="heading in headings" :key="heading.id">
        <a
          :href="`#${heading.id}`"
          class="-ml-px block border-l-2 py-1 pr-2 text-sm transition-colors"
          :class="
            activeId === heading.id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-highlighted'
          "
          :style="{ paddingLeft: `${String(0.75 + (heading.depth - minDepth) * 0.75)}rem` }"
        >
          {{ heading.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>
