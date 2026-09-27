// Forms disable submit until hydrated; a pre-hydration native submit would put credentials in the URL.
export function useIsHydrated() {
  const hydrated = ref(false)
  onMounted(() => {
    hydrated.value = true
  })
  return hydrated
}
