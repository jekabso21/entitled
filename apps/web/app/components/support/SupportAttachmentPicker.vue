<script setup lang="ts">
import type { PendingAttachment } from '~/composables/use-support-attachments'

const { attachments, uploading } = defineProps<{
  attachments: PendingAttachment[]
  uploading: boolean
}>()
const emit = defineEmits<{ add: [files: File[]]; remove: [id: string] }>()

const input = useTemplateRef<HTMLInputElement>('input')

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('add', [...(target.files ?? [])])
  target.value = ''
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <input ref="input" type="file" multiple class="hidden" @change="onChange" />
    <UButton
      icon="i-lucide-paperclip"
      variant="ghost"
      color="neutral"
      label="Attach files"
      :loading="uploading"
      @click="input?.click()"
    />
    <UBadge
      v-for="attachment in attachments"
      :key="attachment.id"
      variant="subtle"
      color="neutral"
      class="gap-1"
    >
      {{ attachment.fileName }}
      <UButton
        icon="i-lucide-x"
        size="xs"
        variant="link"
        color="neutral"
        :aria-label="`Remove ${attachment.fileName}`"
        @click="emit('remove', attachment.id)"
      />
    </UBadge>
  </div>
</template>
