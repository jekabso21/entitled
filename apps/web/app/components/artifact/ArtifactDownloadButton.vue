<script setup lang="ts">
import type { Artifact } from '@entitled/contracts/releases'

const { artifact, isPrimary = false } = defineProps<{ artifact: Artifact; isPrimary?: boolean }>()

const extension = computed(() => {
  const match = /\.([a-z0-9]+(?:\.gz|\.xz|\.bz2)?)$/i.exec(artifact.fileName)
  return match?.[1]?.toUpperCase() ?? 'FILE'
})
const icon = computed(() => artifactIcon(artifact.fileName))
</script>

<template>
  <a
    :href="`/api/artifacts/${artifact.id}/download`"
    :aria-label="`Download ${artifact.fileName}`"
    class="group flex min-h-11 w-full items-center gap-3 rounded-sm border py-1.5 pr-3.5 pl-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-fit sm:min-w-72"
    :class="
      isPrimary
        ? 'border-primary bg-primary text-inverted hover:bg-primary/90'
        : 'border-accented bg-default text-default hover:bg-elevated'
    "
  >
    <UIcon :name="icon" class="size-5 shrink-0" :class="isPrimary ? '' : 'text-muted'" />
    <span class="min-w-0 flex-1">
      <span class="block truncate font-mono text-[13px] leading-4 font-medium">
        {{ artifact.fileName }}
      </span>
      <span
        class="block text-[11px] leading-4"
        :class="isPrimary ? 'text-inverted/80' : 'text-dimmed'"
      >
        {{ formatBytes(artifact.sizeBytes) }} · {{ extension }}
      </span>
    </span>
    <UIcon name="i-lucide-download" class="size-4 shrink-0" />
  </a>
</template>
