<script setup lang="ts">
import { renderSVG } from 'uqr'

const { data: user, refresh } = useCurrentUser()
const { $authClient } = useNuxtApp()
const toast = useToast()

const password = ref('')
const code = ref<string[]>([])
const setup = ref<{ qrSvg: string; backupCodes: string[] } | null>(null)
const pending = ref(false)

async function run(action: () => Promise<{ error: { message?: string } | null }>) {
  pending.value = true
  try {
    const { error } = await action()
    if (error) toast.add({ title: error.message ?? 'Something went wrong', color: 'error' })
    return !error
  } finally {
    pending.value = false
  }
}

async function start() {
  await run(async () => {
    const result = await $authClient.twoFactor.enable({ password: password.value, method: 'totp' })
    if (result.data?.method === 'totp') {
      setup.value = {
        qrSvg: renderSVG(result.data.totpURI),
        backupCodes: result.data.backupCodes,
      }
    }
    return result
  })
  password.value = ''
}

async function confirm() {
  const ok = await run(() => $authClient.twoFactor.verifyTotp({ code: code.value.join('') }))
  if (!ok) return
  toast.add({ title: 'Two-factor authentication is on', color: 'success' })
  setup.value = null
  code.value = []
  await refresh()
}

async function disable() {
  const ok = await run(() => $authClient.twoFactor.disable({ password: password.value }))
  password.value = ''
  if (!ok) return
  toast.add({ title: 'Two-factor authentication is off', color: 'success' })
  await refresh()
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="font-semibold text-highlighted">Two-factor authentication</h2>
          <p class="text-sm text-muted">
            Require a code from an authenticator app when signing in.
          </p>
        </div>
        <UBadge
          variant="subtle"
          :color="user?.twoFactorEnabled ? 'success' : 'neutral'"
          :label="user?.twoFactorEnabled ? 'On' : 'Off'"
        />
      </div>
    </template>

    <div v-if="setup" class="space-y-6">
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="space-y-2">
          <p class="text-sm">1. Scan this code with your authenticator app.</p>
          <!-- eslint-disable-next-line vue/no-v-html -- SVG generated locally by uqr from the TOTP URI -->
          <div class="w-48 rounded-md bg-white p-2" v-html="setup.qrSvg" />
        </div>
        <div class="space-y-2">
          <p class="text-sm">2. Store these backup codes somewhere safe. Each works once.</p>
          <ul class="grid grid-cols-2 gap-1 font-mono text-sm">
            <li v-for="backupCode in setup.backupCodes" :key="backupCode">{{ backupCode }}</li>
          </ul>
        </div>
      </div>
      <form class="space-y-3" @submit.prevent="confirm">
        <p class="text-sm">3. Enter the 6-digit code the app shows.</p>
        <UPinInput v-model="code" :length="6" otp />
        <UButton type="submit" :loading="pending" :disabled="code.length < 6" label="Turn on" />
      </form>
    </div>

    <form
      v-else
      class="flex flex-wrap items-end gap-3"
      @submit.prevent="user?.twoFactorEnabled ? disable() : start()"
    >
      <UFormField label="Confirm with your password" class="min-w-64 flex-1">
        <UInput v-model="password" type="password" autocomplete="current-password" class="w-full" />
      </UFormField>
      <UButton
        type="submit"
        :loading="pending"
        :disabled="!password"
        :color="user?.twoFactorEnabled ? 'error' : 'primary'"
        :variant="user?.twoFactorEnabled ? 'soft' : 'solid'"
        :label="user?.twoFactorEnabled ? 'Turn off' : 'Set up'"
      />
    </form>
  </UCard>
</template>
