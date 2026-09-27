export function useSignOut() {
  const { $authClient } = useNuxtApp()
  return async () => {
    await $authClient.signOut()
    clearNuxtData('current-user')
    await navigateTo('/login')
  }
}
