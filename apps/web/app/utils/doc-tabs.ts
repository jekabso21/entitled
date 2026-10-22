// Content tabs arrive as server-rendered markup with the first tab open; this switches them.
export function selectDocTab(tab: HTMLElement) {
  const list = tab.closest('[role="tablist"]')
  const root = list?.parentElement
  if (!list || !root) return
  for (const other of list.querySelectorAll<HTMLElement>('[role="tab"]')) {
    const isSelected = other === tab
    other.setAttribute('aria-selected', String(isSelected))
    other.tabIndex = isSelected ? 0 : -1
    const panel = root.querySelector<HTMLElement>(
      `#${CSS.escape(other.getAttribute('aria-controls') ?? '')}`,
    )
    if (panel) panel.hidden = !isSelected
  }
}

export function onDocTabKey(event: KeyboardEvent) {
  if (!(event.target instanceof HTMLElement) || event.target.role !== 'tab') return
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  const tabs = [
    ...(event.target.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []),
  ]
  const step = event.key === 'ArrowRight' ? 1 : -1
  const next = tabs[(tabs.indexOf(event.target) + step + tabs.length) % tabs.length]
  if (!next) return
  event.preventDefault()
  selectDocTab(next)
  next.focus()
}

export function onDocTabClick(event: MouseEvent) {
  const tab = event.target instanceof Element ? event.target.closest('[role="tab"]') : null
  if (tab instanceof HTMLElement) selectDocTab(tab)
}
