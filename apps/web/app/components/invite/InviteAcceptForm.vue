<script setup lang="ts">
import { acceptInvitationInputSchema } from '@entitled/contracts/invitations'
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

const { token, email } = defineProps<{ token: string; email: string }>()
const emit = defineEmits<{ accepted: [] }>()

const schema = acceptInvitationInputSchema
  .extend({ confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({})
const errorMessage = ref<string | null>(null)
const needsSignIn = ref(false)
const pending = ref(false)
const hydrated = useIsHydrated()

async function accept(body: { name: string; password: string } | Record<string, never>) {
  pending.value = true
  errorMessage.value = null
  try {
    await $fetch(`/api/invitations/${token}/accept`, { method: 'POST', body })
    emit('accepted')
  } catch (error) {
    needsSignIn.value = hasStatus(error, 403)
    errorMessage.value = apiErrorMessage(error, 'Could not accept the invitation')
  } finally {
    pending.value = false
  }
}

function onSubmit(event: FormSubmitEvent<Schema>) {
  return accept({ name: event.data.name, password: event.data.password })
}
</script>

<template>
  <div class="space-y-4">
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email">
        <UInput :model-value="email" disabled class="w-full" />
      </UFormField>
      <UFormField label="Your name" name="name">
        <UInput v-model="state.name" autocomplete="name" class="w-full" />
      </UFormField>
      <UFormField label="Password" name="password" help="At least 12 characters">
        <UInput
          v-model="state.password"
          type="password"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Confirm password" name="confirmPassword">
        <UInput
          v-model="state.confirmPassword"
          type="password"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>
      <UAlert v-if="errorMessage" color="error" variant="subtle" :title="errorMessage" />
      <UButton type="submit" block :loading="pending" :disabled="!hydrated">
        Create account
      </UButton>
    </UForm>
    <div v-if="needsSignIn" class="space-y-2 text-sm text-muted">
      <p>You already have an account. Sign in, then accept here.</p>
      <div class="flex gap-2">
        <UButton
          variant="outline"
          :to="{ path: '/login', query: { redirect: `/invite/${token}` } }"
          label="Sign in"
        />
        <UButton
          variant="soft"
          :loading="pending"
          label="Accept as signed-in user"
          @click="accept({})"
        />
      </div>
    </div>
  </div>
</template>
