<script setup lang="ts">
import type { SupportThread, SupportThreadStatus } from '@entitled/contracts/support'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const threadId = computed(() => String(route.params.id))
const { data: thread, refresh } = await useFetch<SupportThread>(
  () => `/api/support/threads/${threadId.value}`,
  { key: `support-thread-${threadId.value}` },
)

const statusItems = (Object.keys(supportStatusLabel) as SupportThreadStatus[]).map((value) => ({
  label: supportStatusLabel[value],
  value,
}))

async function setStatus(status: SupportThreadStatus) {
  await $fetch(`/api/support/threads/${threadId.value}`, { method: 'PATCH', body: { status } })
  await refresh()
}

useSeoMeta({ title: () => thread.value?.subject ?? 'Support' })
</script>

<template>
  <UDashboardPanel id="support-thread">
    <template #header>
      <UDashboardNavbar :title="thread?.subject ?? 'Support'">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" to="/admin/support" />
        </template>
        <template #right>
          <USelect
            v-if="thread"
            :model-value="thread.status"
            :items="statusItems"
            class="w-48"
            aria-label="Status"
            @update:model-value="setStatus"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div v-if="thread" class="mx-auto w-full max-w-3xl space-y-4">
        <p class="text-sm text-muted">
          {{ thread.clientAccountName }} · {{ thread.productName }}
          <span v-if="thread.releaseVersion"> · {{ thread.releaseVersion }}</span>
        </p>
        <SupportMessageCard
          v-for="message in thread.messages"
          :key="message.id"
          :message="message"
        />
        <UCard>
          <SupportReplyForm :thread-id="thread.id" allow-internal @posted="refresh" />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
