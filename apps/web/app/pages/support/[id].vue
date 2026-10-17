<script setup lang="ts">
import type { SupportThread } from '@entitled/contracts/support'

definePageMeta({ layout: 'client' })

const route = useRoute()
const threadId = computed(() => String(route.params.id))
const {
  data: thread,
  refresh,
  error,
} = await useFetch<SupportThread>(() => `/api/support/threads/${threadId.value}`, {
  key: `support-thread-${threadId.value}`,
})

async function setStatus(status: 'open' | 'resolved') {
  await $fetch(`/api/support/threads/${threadId.value}`, { method: 'PATCH', body: { status } })
  await refresh()
}

useSeoMeta({ title: () => thread.value?.subject ?? 'Support request' })
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <UButton
      icon="i-lucide-arrow-left"
      variant="link"
      color="neutral"
      to="/support"
      label="Support"
    />
    <template v-if="thread">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold text-highlighted">{{ thread.subject }}</h1>
          <p class="text-sm text-muted">
            {{ thread.productName
            }}<span v-if="thread.releaseVersion"> · {{ thread.releaseVersion }}</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UBadge
            variant="subtle"
            :color="supportStatusColor[thread.status]"
            :label="supportStatusLabel[thread.status]"
          />
          <UButton
            v-if="thread.status !== 'resolved'"
            variant="outline"
            color="neutral"
            label="Mark resolved"
            @click="setStatus('resolved')"
          />
          <UButton
            v-else
            variant="outline"
            color="neutral"
            label="Reopen"
            @click="setStatus('open')"
          />
        </div>
      </div>
      <div class="space-y-3">
        <SupportMessageCard
          v-for="message in thread.messages"
          :key="message.id"
          :message="message"
        />
      </div>
      <UCard>
        <SupportReplyForm :thread-id="thread.id" @posted="refresh" />
      </UCard>
    </template>
    <UAlert v-else-if="error" color="warning" variant="subtle" title="Request not found" />
  </div>
</template>
