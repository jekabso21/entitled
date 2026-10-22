<script setup lang="ts">
import type { HardwareRevision } from '@entitled/contracts/products'
import type { Release } from '@entitled/contracts/releases'

const { release, revisions = [] } = defineProps<{
  release: Release
  revisions?: readonly HardwareRevision[]
}>()

const compatibility = computed(() => revisionRangeLabel(release, revisions))
</script>

<template>
  <UCollapsible as="li" class="group/item border-b border-default last:border-b-0">
    <button
      type="button"
      class="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:px-5"
    >
      <span class="min-w-0 flex-1">
        <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ReleaseVersionLabel :version="release.version" />
          <span v-if="release.title" class="truncate text-sm text-default">{{
            release.title
          }}</span>
        </span>
        <span class="mt-0.5 block text-xs text-dimmed">
          {{ formatDate(release.publishedAt) }}
          <template v-if="release.artifacts.length">
            · {{ release.artifacts.length }}
            {{ release.artifacts.length === 1 ? 'file' : 'files' }}
          </template>
          <template v-if="compatibility"> · {{ compatibility }}</template>
        </span>
      </span>
      <UIcon
        name="i-lucide-chevron-down"
        class="size-4 shrink-0 text-dimmed transition-transform group-data-[state=open]/item:rotate-180"
      />
    </button>
    <template #content>
      <div class="space-y-5 px-4 pt-1 pb-5 sm:px-5">
        <MarkdownContent v-if="release.changelogHtml" :html="release.changelogHtml" />
        <ReleaseDownloads v-if="release.artifacts.length" :artifacts="release.artifacts" />
        <div v-if="release.installInstructionsHtml" class="space-y-2">
          <h4 class="text-sm font-medium text-highlighted">Install instructions</h4>
          <MarkdownContent :html="release.installInstructionsHtml" />
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
