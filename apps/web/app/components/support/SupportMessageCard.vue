<script setup lang="ts">
import type { SupportMessage } from '@entitled/contracts/support'

const { message } = defineProps<{ message: SupportMessage }>()
</script>

<template>
  <article
    class="rounded-lg border p-4"
    :class="
      message.internal
        ? 'border-warning/40 bg-warning/5'
        : message.fromVendor
          ? 'border-primary/30 bg-primary/5'
          : 'border-default'
    "
  >
    <header class="mb-3 flex flex-wrap items-center gap-2 text-sm">
      <span class="font-medium text-highlighted">{{ message.authorName ?? 'Former user' }}</span>
      <UBadge v-if="message.fromVendor" size="sm" variant="subtle" label="Vendor" />
      <UBadge
        v-if="message.internal"
        size="sm"
        color="warning"
        variant="subtle"
        label="Internal note"
      />
      <span class="text-muted">{{ formatDateTime(message.createdAt) }}</span>
    </header>
    <MarkdownContent :html="message.bodyHtml" />
    <ul v-if="message.attachments.length" class="mt-3 flex flex-wrap gap-2">
      <li v-for="attachment in message.attachments" :key="attachment.id">
        <UButton
          :to="`/api/support/attachments/${attachment.id}/download`"
          external
          size="sm"
          variant="soft"
          color="neutral"
          icon="i-lucide-paperclip"
          :label="`${attachment.fileName} (${formatBytes(attachment.sizeBytes)})`"
        />
      </li>
    </ul>
  </article>
</template>
