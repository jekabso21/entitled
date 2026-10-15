// Dates render as ISO strings in UTC so the server and the browser produce identical
// text; toLocale*() varies by time zone and locale and breaks hydration.
export function formatDate(value: string | null) {
  return value ? value.slice(0, 10) : '—'
}

export function formatDateTime(value: string | null) {
  return value ? `${value.slice(0, 10)} ${value.slice(11, 16)} UTC` : '—'
}

export function dateCell(value: string | null, withTime = false) {
  return withTime ? formatDateTime(value) : formatDate(value)
}
