export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  // /api/** belongs to the API service behind Caddy, so the icon endpoint lives elsewhere.
  icon: { localApiEndpoint: '/_nuxt_icon' },
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },
  runtimeConfig: {
    // Where server-side rendering reaches the API; browsers go through the same origin.
    apiInternalUrl: 'http://localhost:3001',
    public: {
      portalName: 'Entitled',
    },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        // exactOptionalPropertyTypes stays off here: Vue templates pass `undefined` for unset props.
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        verbatimModuleSyntax: true,
      },
    },
  },
})
