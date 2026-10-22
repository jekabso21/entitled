<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const step = ref<'password' | 'two-factor'>('password')
const { data: user, refresh } = useCurrentUser()

async function finish() {
  await refresh()
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  await navigateTo(redirect ?? (user.value ? homePath(user.value) : '/'))
}

useSeoMeta({ title: 'Sign in' })
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold tracking-tight text-highlighted">
        {{ step === 'password' ? 'Sign in' : 'Two-factor verification' }}
      </h1>
      <p v-if="step === 'password'" class="text-sm text-muted">
        Use the email address your invitation was sent to.
      </p>
    </div>
    <AuthSignInForm
      v-if="step === 'password'"
      @signed-in="finish"
      @two-factor-required="step = 'two-factor'"
    />
    <AuthTwoFactorForm v-else @verified="finish" />
  </div>
</template>
