import type { Branding } from '@entitled/contracts/settings'

const fallback: Branding = { portalName: 'Entitled', primaryColor: 'indigo', logoUrl: null }

export function useBranding() {
  const requestFetch = useRequestFetch()
  return useAsyncData<Branding>('branding', () => requestFetch<Branding>('/api/branding'), {
    default: () => fallback,
  })
}
