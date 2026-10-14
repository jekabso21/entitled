// Applies the vendor's colour before the first render, on the server and in the browser,
// so white-labelled pages never flash the default theme.
export default defineNuxtPlugin(async () => {
  const { data: branding } = await useBranding()
  watch(
    () => branding.value.primaryColor,
    (primary) => {
      updateAppConfig({ ui: { colors: { primary } } })
    },
    { immediate: true },
  )
})
