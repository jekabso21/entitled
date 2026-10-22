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
    <template v-if="thread">
      <PageHeader
        :title="thread.subject"
        :breadcrumbs="[{ label: 'Support', to: '/support' }, { label: thread.subject }]"
      >
        <template #meta>
          <StatusBadge
            :color="supportStatusColor[thread.status]"
            :label="supportStatusLabel[thread.status]"
          />
          <span class="text-sm text-muted">{{ thread.productName }}</span>
          <ReleaseVersionLabel
            v-if="thread.releaseVersion"
            :version="thread.releaseVersion"
            size="sm"
          />
        </template>
        <template #actions>
          <UButton
            v-if="thread.status !== 'resolved'"
            variant="outline"
            color="neutral"
            icon="i-lucide-check"
            label="Mark resolved"
            @click="setStatus('resolved')"
          />
          <UButton
            v-else
            variant="outline"
            color="neutral"
            icon="i-lucide-rotate-ccw"
            label="Reopen"
            @click="setStatus('open')"
          />
        </template>
      </PageHeader>
      <ol class="space-y-5">
        <li v-for="message in thread.messages" :key="message.id">
          <SupportMessageCard :message="message" />
        </li>
      </ol>
      <UCard>
        <SupportReplyForm :thread-id="thread.id" @posted="refresh" />
      </UCard>
    </template>
    <UAlert
      v-else-if="error"
      color="warning"
      variant="subtle"
      title="Request not found"
      :actions="[{ label: 'All requests', to: '/support', color: 'neutral', variant: 'outline' }]"
    />
  </div>
</template>
