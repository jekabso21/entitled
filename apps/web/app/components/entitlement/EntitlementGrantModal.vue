<script setup lang="ts">
import type { Product } from '@entitled/contracts/products'

const { clientAccountId, products } = defineProps<{
  clientAccountId: string
  products: Product[]
}>()
const emit = defineEmits<{ granted: [] }>()

const open = ref(false)
const productId = ref<string>()
const revisionIds = ref<string[]>([])
const pending = ref(false)
const toast = useToast()

const productItems = computed(() =>
  products.map((product) => ({ label: product.name, value: product.id })),
)
const revisionItems = computed(
  () =>
    products
      .find((product) => product.id === productId.value)
      ?.revisions.map((revision) => ({
        label: `${revision.code} · ${revision.name}`,
        value: revision.id,
      })) ?? [],
)

watch(productId, () => {
  revisionIds.value = []
})

async function grant() {
  if (!productId.value) return
  pending.value = true
  try {
    await $fetch('/api/entitlements', {
      method: 'POST',
      body: { clientAccountId, productId: productId.value, revisionIds: revisionIds.value },
    })
    toast.add({ title: 'Access granted', color: 'success' })
    open.value = false
    productId.value = undefined
    emit('granted')
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Grant product access">
    <UButton icon="i-lucide-key-round" label="Grant access" variant="soft" />
    <template #body>
      <form class="space-y-4" @submit.prevent="grant">
        <UFormField label="Product">
          <USelect
            v-model="productId"
            :items="productItems"
            placeholder="Choose a product"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Revisions"
          help="Leave empty to grant every revision, including future ones."
        >
          <USelect
            v-model="revisionIds"
            :items="revisionItems"
            multiple
            :disabled="revisionItems.length === 0"
            placeholder="All revisions"
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end">
          <UButton type="submit" :loading="pending" :disabled="!productId" label="Grant" />
        </div>
      </form>
    </template>
  </UModal>
</template>
