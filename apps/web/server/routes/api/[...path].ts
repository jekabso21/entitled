// Forwards /api/** to the API so SSR fetches and the dev server share the browser's origin.
// In production Caddy routes browser /api traffic to the API directly.
export default defineEventHandler((event) => {
  const { apiInternalUrl } = useRuntimeConfig(event)
  return proxyRequest(event, new URL(event.path, apiInternalUrl).toString())
})
