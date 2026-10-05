<script setup lang="ts">
import type { ClientAccountDetail } from '@entitled/contracts/client-accounts'
import type { Entitlement } from '@entitled/contracts/entitlements'
import type { Product } from '@entitled/contracts/products'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const accountId = computed(() => String(route.params.id))
const { data: user } = useCurrentUser()
const isAdmin = computed(() => user.value?.vendorRole === 'admin')

const { data: account } = await useFetch<ClientAccountDetail>(
  () => `/api/client-accounts/${accountId.value}`,
  { key: `client-account-${accountId.value}` },
)
const { data: entitlements, refresh: refreshEntitlements } = await useFetch<Entitlement[]>(
  () => `/api/client-accounts/${accountId.value}/entitlements`,
  { key: `entitlements-${accountId.value}`, default: () => [] },
)
const { data: products } = await useFetch<Product[]>('/api/products', {
  key: 'products',
  default: () => [],
})

const toast = useToast()

function revisionLabel(entitlement: Entitlement) {
  if (entitlement.revisionIds.length === 0) return 'All revisions'
  const revisions = products.value.find(
    (product) => product.id === entitlement.productId,
  )?.revisions
  return entitlement.revisionIds
    .map((id) => revisions?.find((revision) => revision.id === id)?.code ?? '?')
    .join(', ')
}

async function revoke(entitlement: Entitlement) {
  try {
    await $fetch(`/api/entitlements/${entitlement.id}`, { method: 'DELETE' })
    toast.add({ title: `Access to ${entitlement.productName} revoked`, color: 'success' })
    await refreshEntitlements()
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
}

useSeoMeta({ title: () => account.value?.name ?? 'Client account' })
</script>

<template>
  <UDashboardPanel id="client-account">
    <template #header>
      <UDashboardNavbar :title="account?.name ?? 'Client account'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            to="/admin/client-accounts"
          />
        </template>
        <template #right>
          <InvitationCreateModal
            v-if="isAdmin && account"
            :client-account-id="account.id"
            :client-account-name="account.name"
            button-label="Invite user"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div v-if="account" class="grid gap-6 lg:grid-cols-2">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-highlighted">Product access</h2>
              <EntitlementGrantModal
                v-if="isAdmin"
                :client-account-id="account.id"
                :products="products"
                @granted="refreshEntitlements"
              />
            </div>
          </template>
          <ul v-if="entitlements.length" class="divide-y divide-default">
            <li
              v-for="entitlement in entitlements"
              :key="entitlement.id"
              class="flex items-center justify-between gap-3 py-2"
            >
              <div>
                <p class="font-medium">{{ entitlement.productName }}</p>
                <p class="text-sm text-muted">{{ revisionLabel(entitlement) }}</p>
              </div>
              <UButton
                v-if="isAdmin"
                icon="i-lucide-x"
                color="error"
                variant="ghost"
                :aria-label="`Revoke ${entitlement.productName}`"
                @click="revoke(entitlement)"
              />
            </li>
          </ul>
          <p v-else class="text-sm text-muted">No products granted yet.</p>
        </UCard>
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">Users</h2>
          </template>
          <ul v-if="account.members.length" class="divide-y divide-default">
            <li
              v-for="member in account.members"
              :key="member.userId"
              class="flex items-center justify-between gap-3 py-2"
            >
              <div>
                <p class="font-medium">{{ member.name }}</p>
                <p class="text-sm text-muted">{{ member.email }}</p>
              </div>
              <UBadge
                variant="subtle"
                :color="member.role === 'admin' ? 'primary' : 'neutral'"
                :label="member.role === 'admin' ? 'Client admin' : 'Client user'"
              />
            </li>
          </ul>
          <p v-else class="text-sm text-muted">No users yet. Invite someone to get started.</p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
