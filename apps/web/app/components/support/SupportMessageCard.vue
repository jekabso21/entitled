<script setup lang="ts">
import type { SupportMessage } from '@entitled/contracts/support'

const { message } = defineProps<{ message: SupportMessage }>()
</script>

<template>
  <article class="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
    <UAvatar
      :alt="message.authorName ?? 'Former user'"
      size="md"
      :class="
        message.fromVendor
          ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
          : 'bg-default ring-1 ring-default'
      "
    />
    <div class="min-w-0 space-y-1.5">
      <header class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span class="text-sm font-medium text-highlighted">{{
          message.authorName ?? 'Former user'
        }}</span>
        <UBadge v-if="message.fromVendor" size="sm" variant="subtle" label="Staff" />
        <UBadge
          v-if="message.internal"
          size="sm"
          color="warning"
          variant="subtle"
          icon="i-lucide-eye-off"
          label="Internal note · not visible to client"
        />
        <time class="text-dimmed" :datetime="message.createdAt">{{
          formatDateTime(message.createdAt)
        }}</time>
      </header>
      <div
        class="border px-3 py-2.5"
        :class="
          message.internal
            ? 'border-dashed border-warning/50 bg-warning/5'
            : message.fromVendor
              ? 'border-primary/30 bg-primary/5'
              : 'border-default bg-default'
        "
      >
        <MarkdownContent :html="message.bodyHtml" />
        <ul v-if="message.attachments.length" class="mt-3 flex flex-wrap gap-2">
          <li v-for="attachment in message.attachments" :key="attachment.id">
            <UButton
              :to="`/api/support/attachments/${attachment.id}/download`"
              external
              size="sm"
              variant="outline"
              color="neutral"
              icon="i-lucide-paperclip"
              :label="`${attachment.fileName} (${formatBytes(attachment.sizeBytes)})`"
              :ui="{ label: 'font-mono text-xs' }"
            />
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>
