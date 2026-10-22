// Blocks the editor inserts as Markdown, so they read back exactly as a saved page would.
export const calloutKinds = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const
export type CalloutKind = (typeof calloutKinds)[number]

export const calloutLabels = {
  NOTE: 'Note',
  TIP: 'Tip',
  IMPORTANT: 'Important',
  WARNING: 'Warning',
  CAUTION: 'Caution',
} satisfies Record<CalloutKind, string>

export function calloutMarkdown(kind: CalloutKind) {
  return `> [!${kind}]\n> ${calloutLabels[kind]} text.`
}

// Menu items carry their callout kind; anything else falls back to a note.
export function calloutOf(item: unknown): CalloutKind {
  if (typeof item !== 'object' || item === null || !('callout' in item)) return 'NOTE'
  const { callout } = item
  return calloutKinds.find((kind) => kind === callout) ?? 'NOTE'
}

export const TABS_MARKDOWN = [
  '## Installation {.tabset}',
  '### Windows',
  'Steps for Windows.',
  '### Linux',
  'Steps for Linux.',
].join('\n\n')

export type MathTarget = { kind: 'block' | 'inline'; latex: string; pos?: number }
