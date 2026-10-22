<script setup lang="ts">
import type { Artifact } from '@entitled/contracts/releases'

const { artifacts, hasPrimary = false } = defineProps<{
  artifacts: readonly Artifact[]
  hasPrimary?: boolean
}>()
</script>

<template>
  <ul class="flex flex-col gap-3">
    <li v-for="(artifact, index) in artifacts" :key="artifact.id" class="space-y-1">
      <ArtifactDownloadButton :artifact="artifact" :is-primary="hasPrimary && index === 0" />
      <ArtifactChecksum v-if="artifact.sha256" :value="artifact.sha256" />
    </li>
  </ul>
</template>
