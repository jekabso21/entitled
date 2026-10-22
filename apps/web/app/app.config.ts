export default defineAppConfig({
  ui: {
    colors: {
      primary: 'indigo',
      neutral: 'steel',
      success: 'green',
      warning: 'amber',
      error: 'red',
      info: 'sky',
    },
    // Panels, tables and dialogs are square; only controls, badges and menus round slightly.
    card: { slots: { root: 'rounded-none', header: 'px-4 py-3 sm:px-5', body: 'p-4 sm:p-5' } },
    modal: { slots: { content: 'rounded-none' } },
    slideover: { slots: { content: 'rounded-none' } },
    table: {
      slots: {
        root: 'border border-default bg-default',
        th: 'py-2.5 text-xs font-medium text-muted',
        td: 'py-3 text-default tabular-nums',
        tr: 'hover:bg-muted/60 transition-colors',
      },
    },
    button: { slots: { base: 'font-medium' } },
    badge: { slots: { base: 'font-medium' } },
    alert: { slots: { root: 'rounded-sm' } },
    breadcrumb: {
      variants: { active: { true: { link: 'text-highlighted font-medium' } } },
    },
    dashboardNavbar: { slots: { root: 'bg-default', title: 'text-base font-semibold' } },
    dashboardSidebar: { slots: { root: 'bg-default', header: 'h-(--ui-header-height)' } },
    dashboardPanel: { slots: { root: 'bg-app', body: 'p-4 sm:p-6 lg:p-8 gap-6 sm:gap-6' } },
  },
})
