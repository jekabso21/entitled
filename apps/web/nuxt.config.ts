export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      portalName: 'Entitled',
    },
  },
  // In production Caddy serves the API under the same origin; in dev Nuxt proxies it.
  $development: {
    routeRules: {
      '/api/**': { proxy: 'http://localhost:3001/api/**' },
    },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: true,
        exactOptionalPropertyTypes: true,
        noImplicitOverride: true,
        verbatimModuleSyntax: true,
      },
    },
  },
})
