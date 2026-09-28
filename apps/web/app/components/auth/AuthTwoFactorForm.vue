<script setup lang="ts">
const emit = defineEmits<{ verified: [] }>()

const code = ref<string[]>([])
const errorMessage = ref<string | null>(null)
const pending = ref(false)
const { $authClient } = useNuxtApp()

async function verify() {
  pending.value = true
  errorMessage.value = null
  const { error } = await $authClient.twoFactor.verifyTotp({ code: code.value.join('') })
  pending.value = false
  if (error) errorMessage.value = error.message ?? 'Invalid code'
  else emit('verified')
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="verify">
    <p class="text-sm text-muted">Enter the 6-digit code from your authenticator app.</p>
    <UPinInput v-model="code" :length="6" otp class="justify-center" />
    <UAlert v-if="errorMessage" color="error" variant="subtle" :title="errorMessage" />
    <UButton type="submit" block :loading="pending" :disabled="code.length < 6">Verify</UButton>
  </form>
</template>
