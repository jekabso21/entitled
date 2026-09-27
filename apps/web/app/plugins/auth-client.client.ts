import { twoFactorClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

export default defineNuxtPlugin(() => {
  const authClient = createAuthClient({
    baseURL: window.location.origin,
    basePath: '/api/auth',
    plugins: [twoFactorClient()],
  })
  return { provide: { authClient } }
})
