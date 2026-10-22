<script setup lang="ts">
import type { ClientAccount } from '@entitled/contracts/client-accounts'
import type { ReleaseAudience } from '@entitled/contracts/releases'

const { productId, productName } = defineProps<{ productId: string; productName: string }>()
const audience = defineModel<ReleaseAudience>('audience', { required: true })
const clientAccountIds = defineModel<string[]>('clientAccountIds', { required: true })

const { data: accounts } = await useFetch<ClientAccount[]>('/api/client-accounts', {
  key: `client-accounts-for-${productId}`,
  query: { productId },
  default: () => [],
})

const audienceItems = computed(() => [
  {
    value: 'entitled',
    label: 'Every client with access',
    description: `All client accounts that have ${productName} (${accounts.value.length} now).`,
  },
  {
    value: 'selected',
    label: 'Only selected client accounts',
    description: 'For a custom build, a fix for one customer or an early preview.',
  },
])
</script>

<template>
  <div class="space-y-3">
    <URadioGroup
      v-model="audience"
      :items="audienceItems"
      variant="card"
      orientation="horizontal"
      :ui="{ fieldset: 'grid gap-3 sm:grid-cols-2', item: 'rounded-sm' }"
    />
    <template v-if="audience === 'selected'">
      <UFormField
        label="Client accounts"
        help="Only accounts that have access to this product are listed."
      >
        <USelectMenu
          v-model="clientAccountIds"
          :items="accounts"
          value-key="id"
          label-key="name"
          multiple
          placeholder="Choose client accounts"
          :search-input="{ placeholder: 'Search accounts' }"
          class="w-full"
        />
      </UFormField>
      <UAlert
        v-if="clientAccountIds.length === 0"
        color="warning"
        variant="subtle"
        icon="i-lucide-eye-off"
        title="No client can download this release yet"
        description="Choose at least one client account."
      />
    </template>
    <UAlert
      v-if="accounts.length === 0"
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      title="No client has access to this product yet"
      description="Grant access on a client account's page, then it can download releases."
      :actions="[
        {
          label: 'Go to client accounts',
          to: '/admin/client-accounts',
          color: 'neutral',
          variant: 'outline',
        },
      ]"
    />
  </div>
</template>
