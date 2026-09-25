type ApiHealth = {
  status: 'ok' | 'degraded'
  database: boolean
}

export function useApiHealth() {
  return useFetch<ApiHealth>('/api/health', { key: 'api-health' })
}
