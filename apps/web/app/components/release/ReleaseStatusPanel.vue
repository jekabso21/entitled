<script setup lang="ts">
import type { Release } from '@entitled/contracts/releases'

const { release } = defineProps<{ release: Release }>()

const readyFiles = computed(() =>
  release.artifacts.filter((artifact) => artifact.status === 'ready'),
)
const hasProcessing = computed(() =>
  release.artifacts.some((artifact) => ['pending', 'processing'].includes(artifact.status)),
)
const audienceLabel = computed(() => {
  if (release.audience === 'entitled') return 'every client with access to this product'
  const count = release.clientAccountIds.length
  if (count === 0) return 'no one yet (no client account chosen)'
  return count === 1 ? '1 selected client account' : `${count} selected client accounts`
})

const summary = computed(() => {
  if (release.status === 'draft') {
    return {
      icon: 'i-lucide-pencil-line',
      title: 'Draft: only your team can see this release',
      text: `When you publish, it becomes available to ${audienceLabel.value}.`,
    }
  }
  if (release.status === 'published') {
    return {
      icon: 'i-lucide-circle-check',
      title: `Published${release.publishedAt ? ` on ${formatDate(release.publishedAt)}` : ''}`,
      text: `Available to ${audienceLabel.value}.`,
    }
  }
  return {
    icon: 'i-lucide-archive',
    title: 'Archived: hidden from clients',
    text: 'Clients can no longer see or download this release.',
  }
})

const steps = computed(() => [
  {
    label: 'Attach files',
    detail: readyFiles.value.length
      ? `${readyFiles.value.length} ready`
      : hasProcessing.value
        ? 'Checking…'
        : 'Optional',
    isDone: readyFiles.value.length > 0 && !hasProcessing.value,
  },
  {
    label: 'Choose who gets it',
    detail:
      release.audience === 'entitled'
        ? 'All clients'
        : `${release.clientAccountIds.length} selected`,
    isDone: release.audience === 'entitled' || release.clientAccountIds.length > 0,
  },
  { label: 'Publish', detail: 'Top right', isDone: false },
])
</script>

<template>
  <section class="border border-default bg-default">
    <div class="flex items-start gap-3 p-4 sm:p-5">
      <UIcon :name="summary.icon" class="mt-0.5 size-5 shrink-0 text-muted" />
      <div class="min-w-0">
        <p class="font-semibold text-highlighted">{{ summary.title }}</p>
        <p class="text-sm text-muted">{{ summary.text }}</p>
      </div>
    </div>
    <ol
      v-if="release.status === 'draft'"
      class="grid border-t border-default sm:grid-cols-3 sm:divide-x sm:divide-default"
    >
      <li
        v-for="(step, index) in steps"
        :key="step.label"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <span
          class="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          :class="step.isDone ? 'bg-success text-inverted' : 'bg-elevated text-muted'"
        >
          <UIcon v-if="step.isDone" name="i-lucide-check" class="size-3.5" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-medium text-highlighted">{{ step.label }}</span>
          <span class="block text-xs text-dimmed">{{ step.detail }}</span>
        </span>
      </li>
    </ol>
  </section>
</template>
