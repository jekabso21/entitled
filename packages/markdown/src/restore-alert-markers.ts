const ESCAPED_ALERT = /^(\s*(?:>\s*)+)\\\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\\\]/gim

// Rich-text editors escape `[` when serialising, which turns `> [!TIP]` callouts into
// plain quotes. Restoring the marker keeps callouts intact through visual edits.
export function restoreAlertMarkers(markdown: string) {
  return markdown.replace(ESCAPED_ALERT, (_match, prefix: string, kind: string) => {
    return `${prefix}[!${kind.toUpperCase()}]`
  })
}
