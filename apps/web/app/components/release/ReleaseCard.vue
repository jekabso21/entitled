<script setup lang="ts">
import type { Release } from '@entitled/contracts/releases'

const { release } = defineProps<{ release: Release }>()

const publishedOn = computed(() =>
  release.publishedAt ? new Date(release.publishedAt).toLocaleDateString() : '',
)
</script>

<template>
  <UCard as="article">
    <template #header>
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ release.version }}
          <span v-if="release.title" class="font-normal text-muted">· {{ release.title }}</span>
        </h2>
        <time class="text-sm text-muted" :datetime="release.publishedAt ?? undefined">{{
          publishedOn
        }}</time>
      </div>
    </template>
    <div class="space-y-6">
      <MarkdownContent v-if="release.changelogHtml" :html="release.changelogHtml" />
      <ul
        v-if="release.artifacts.length"
        class="divide-y divide-default rounded-md border border-default"
      >
        <li
          v-for="artifact in release.artifacts"
          :key="artifact.id"
          class="flex flex-wrap items-center justify-between gap-3 p-3"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">{{ artifact.fileName }}</p>
            <p class="text-xs text-muted">
              {{ formatBytes(artifact.sizeBytes) }} · SHA-256
              <code class="break-all">{{ artifact.sha256 }}</code>
            </p>
          </div>
          <UButton
            icon="i-lucide-download"
            label="Download"
            variant="soft"
            :to="`/api/artifacts/${artifact.id}/download`"
            external
          />
        </li>
      </ul>
      <UCollapsible v-if="release.installInstructionsHtml">
        <UButton
          label="Install instructions"
          variant="link"
          color="neutral"
          trailing-icon="i-lucide-chevron-down"
          class="px-0"
        />
        <template #content>
          <div class="pt-2">
            <MarkdownContent :html="release.installInstructionsHtml" />
          </div>
        </template>
      </UCollapsible>
    </div>
  </UCard>
</template>
