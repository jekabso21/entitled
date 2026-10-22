<script setup lang="ts">
const { value } = defineProps<{ value: string }>()

const copied = ref(false)
const short = computed(() => `${value.slice(0, 8)}…${value.slice(-6)}`)

async function copy() {
  await navigator.clipboard.writeText(value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-1.5 text-xs text-dimmed">
    <span class="shrink-0">SHA-256</span>
    <UTooltip :text="value" :content="{ side: 'top' }">
      <code
        class="rounded-sm bg-elevated px-1.5 py-px font-mono text-muted"
        tabindex="0"
        :aria-label="`SHA-256 ${value}`"
        >{{ short }}</code
      >
    </UTooltip>
    <UButton
      :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
      :color="copied ? 'success' : 'neutral'"
      variant="ghost"
      size="xs"
      square
      :aria-label="copied ? 'Copied' : 'Copy SHA-256 checksum'"
      @click="copy"
    />
  </span>
</template>
