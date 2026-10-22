<script setup lang="ts">
import type { DocSearchResult } from '@entitled/contracts/docs'

const { productId, pagePath } = defineProps<{
  productId: string
  // Where a result leads, e.g. the client page or the admin editor.
  pagePath: (pageId: string) => string
}>()

const query = ref('')
const debounced = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
watch(query, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => (debounced.value = value), 200)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
})
const isSearching = computed(() => debounced.value.trim().length >= 2)

const {
  data: results,
  status,
  execute,
} = await useFetch<DocSearchResult[]>(() => `/api/products/${productId}/docs/search`, {
  key: `doc-search-${productId}`,
  query: { q: debounced },
  default: () => [],
  immediate: false,
  watch: false,
  server: false,
})
watch(debounced, (value) => {
  if (value.trim().length >= 2) void execute()
  else results.value = []
})

// The API marks matched words with ⟦ ⟧; split on them so Vue escapes every part.
function highlight(snippet: string) {
  return snippet.split(/⟦|⟧/).map((text, index) => ({ text, isMatch: index % 2 === 1 }))
}

function clear() {
  query.value = ''
  debounced.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <UInput
      v-model="query"
      icon="i-lucide-search"
      placeholder="Search the docs…"
      aria-label="Search the docs"
      class="w-full"
      :loading="status === 'pending'"
      @keydown.escape="clear"
    />
    <div
      v-if="isSearching"
      class="border border-default bg-default"
      role="region"
      aria-live="polite"
    >
      <p v-if="status !== 'pending' && !results.length" class="p-3 text-sm text-muted">
        No pages match “{{ debounced }}”.
      </p>
      <ul v-else class="max-h-96 divide-y divide-default overflow-y-auto">
        <li v-for="result in results" :key="result.id">
          <NuxtLink
            :to="pagePath(result.id)"
            class="block px-3 py-2.5 transition-colors hover:bg-elevated"
            @click="clear"
          >
            <span class="block text-sm font-medium text-highlighted">{{ result.title }}</span>
            <span class="mt-0.5 line-clamp-2 block text-xs text-muted">
              <template v-for="(part, index) in highlight(result.snippet)" :key="index">
                <mark v-if="part.isMatch" class="bg-primary/15 text-highlighted">{{
                  part.text
                }}</mark>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>
