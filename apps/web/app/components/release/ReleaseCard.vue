<script setup lang="ts">
import type { HardwareRevision } from '@entitled/contracts/products'
import type { Release } from '@entitled/contracts/releases'

const {
  release,
  revisions = [],
  isLatest = false,
} = defineProps<{
  release: Release
  revisions?: readonly HardwareRevision[]
  isLatest?: boolean
}>()

const compatibility = computed(() => revisionRangeLabel(release, revisions))
</script>

<template>
  <article class="space-y-5 border border-default bg-default p-5 sm:p-6">
    <header class="space-y-1.5">
      <ReleaseVersionLabel :version="release.version" :is-latest="isLatest" size="lg" />
      <p class="flex flex-wrap items-center gap-x-2 text-sm text-muted">
        <time v-if="release.publishedAt" :datetime="release.publishedAt"
          >Published {{ formatDate(release.publishedAt) }}</time
        >
        <template v-if="release.title">
          <span aria-hidden="true" class="text-dimmed">·</span>
          <span class="text-default">{{ release.title }}</span>
        </template>
      </p>
    </header>
    <MarkdownContent v-if="release.changelogHtml" :html="release.changelogHtml" />
    <UAlert
      v-if="compatibility"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="`For ${compatibility}`"
      description="Check the hardware revision on the unit's label before you install."
    />
    <section v-if="release.artifacts.length" aria-label="Downloads" class="space-y-2">
      <h3 class="text-sm font-medium text-highlighted">Downloads</h3>
      <ReleaseDownloads :artifacts="release.artifacts" :has-primary="isLatest" />
    </section>
    <UCollapsible v-if="release.installInstructionsHtml" class="border-t border-default pt-3">
      <UButton
        label="Install instructions"
        icon="i-lucide-book-open"
        variant="ghost"
        color="neutral"
        trailing-icon="i-lucide-chevron-down"
        class="-mx-2.5 group"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
      />
      <template #content>
        <div class="pt-3">
          <MarkdownContent :html="release.installInstructionsHtml" />
        </div>
      </template>
    </UCollapsible>
  </article>
</template>
