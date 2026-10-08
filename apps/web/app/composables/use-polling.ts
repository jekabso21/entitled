import type { Ref } from 'vue'

// Calls `tick` every `intervalMs` while `active` is true; stops when the component unmounts.
export function usePolling(tick: () => unknown, intervalMs: number, active: Ref<boolean>) {
  let timer: ReturnType<typeof setInterval> | undefined

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = undefined
  }

  onMounted(() => {
    watch(
      active,
      (isActive) => {
        stop()
        if (isActive) timer = setInterval(tick, intervalMs)
      },
      { immediate: true },
    )
  })
  onBeforeUnmount(stop)
}
