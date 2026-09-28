<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

const emit = defineEmits<{ signedIn: []; twoFactorRequired: [] }>()

const schema = z.object({
  email: z.email({ error: 'Enter a valid email' }),
  password: z.string().min(1, { error: 'Enter your password' }),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({})
const errorMessage = ref<string | null>(null)
const pending = ref(false)
const hydrated = useIsHydrated()
const { $authClient } = useNuxtApp()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  pending.value = true
  errorMessage.value = null
  const { data, error } = await $authClient.signIn.email(event.data)
  pending.value = false
  if (error) {
    errorMessage.value = error.message ?? 'Sign-in failed'
    return
  }
  if ('twoFactorRedirect' in data && data.twoFactorRedirect) emit('twoFactorRequired')
  else emit('signedIn')
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField label="Email" name="email">
      <UInput v-model="state.email" type="email" autocomplete="username" class="w-full" />
    </UFormField>
    <UFormField label="Password" name="password">
      <UInput
        v-model="state.password"
        type="password"
        autocomplete="current-password"
        class="w-full"
      />
    </UFormField>
    <UAlert v-if="errorMessage" color="error" variant="subtle" :title="errorMessage" />
    <UButton type="submit" block :loading="pending" :disabled="!hydrated">Sign in</UButton>
  </UForm>
</template>
