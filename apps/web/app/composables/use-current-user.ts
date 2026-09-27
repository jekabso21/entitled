import type { CurrentUser } from '@entitled/contracts/accounts'

export function useCurrentUser() {
  const requestFetch = useRequestFetch()
  return useAsyncData<CurrentUser | null>(
    'current-user',
    () =>
      requestFetch<CurrentUser>('/api/me').catch((error: unknown) => {
        // Signed-out visitors get a 401; that is a normal state, not an error.
        if (hasStatus(error, 401)) return null
        throw error
      }),
    { default: () => null },
  )
}
