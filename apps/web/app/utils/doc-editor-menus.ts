import type { EditorHandler, EditorSuggestionMenuItem, EditorToolbarItem } from '@nuxt/ui'

export type DocEditorHandlers = Record<
  'attachment' | 'media' | 'table' | 'callout' | 'tabs' | 'mathBlock' | 'mathInline' | 'pageLink',
  EditorHandler
>

export const docEditorToolbar: EditorToolbarItem<DocEditorHandlers>[][] = [
  [
    { kind: 'undo', icon: 'i-lucide-undo', 'aria-label': 'Undo' },
    { kind: 'redo', icon: 'i-lucide-redo', 'aria-label': 'Redo' },
  ],
  [
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', 'aria-label': 'Heading 2' },
    { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', 'aria-label': 'Heading 3' },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', 'aria-label': 'Bold' },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', 'aria-label': 'Italic' },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', 'aria-label': 'Inline code' },
    { kind: 'link', icon: 'i-lucide-link', 'aria-label': 'Link' },
    { kind: 'pageLink', icon: 'i-lucide-file-symlink', 'aria-label': 'Link to a page' },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', 'aria-label': 'Bullet list' },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', 'aria-label': 'Numbered list' },
    { kind: 'taskList', icon: 'i-lucide-list-checks', 'aria-label': 'Task list' },
    { kind: 'blockquote', icon: 'i-lucide-text-quote', 'aria-label': 'Quote' },
    { kind: 'codeBlock', icon: 'i-lucide-square-code', 'aria-label': 'Code block' },
  ],
  [
    { kind: 'table', icon: 'i-lucide-table', 'aria-label': 'Insert table' },
    { kind: 'media', icon: 'i-lucide-image-plus', 'aria-label': 'Insert image or video' },
    { kind: 'attachment', icon: 'i-lucide-paperclip', 'aria-label': 'Attach a file' },
    { kind: 'mathBlock', icon: 'i-lucide-sigma', 'aria-label': 'Insert formula' },
  ],
]

export const docEditorBubble: EditorToolbarItem<DocEditorHandlers>[][] = [
  [
    {
      label: 'Turn into',
      trailingIcon: 'i-lucide-chevron-down',
      items: [
        { kind: 'paragraph', label: 'Text', icon: 'i-lucide-type' },
        { kind: 'heading', level: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
        { kind: 'heading', level: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
        { kind: 'bulletList', label: 'Bullet list', icon: 'i-lucide-list' },
        { kind: 'orderedList', label: 'Numbered list', icon: 'i-lucide-list-ordered' },
        { kind: 'blockquote', label: 'Quote', icon: 'i-lucide-text-quote' },
        { kind: 'codeBlock', label: 'Code block', icon: 'i-lucide-square-code' },
      ],
    },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', 'aria-label': 'Bold' },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', 'aria-label': 'Italic' },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', 'aria-label': 'Strikethrough' },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', 'aria-label': 'Inline code' },
    { kind: 'link', icon: 'i-lucide-link', 'aria-label': 'Link' },
  ],
]

const calloutIcons = {
  NOTE: 'i-lucide-info',
  TIP: 'i-lucide-lightbulb',
  IMPORTANT: 'i-lucide-message-square-warning',
  WARNING: 'i-lucide-triangle-alert',
  CAUTION: 'i-lucide-octagon-alert',
} satisfies Record<CalloutKind, string>

export const docEditorSlashMenu: EditorSuggestionMenuItem<DocEditorHandlers>[][] = [
  [
    { type: 'label', label: 'Text' },
    { kind: 'paragraph', label: 'Text', icon: 'i-lucide-type' },
    { kind: 'heading', level: 1, label: 'Heading 1', icon: 'i-lucide-heading-1' },
    { kind: 'heading', level: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
    { kind: 'heading', level: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
    { kind: 'bulletList', label: 'Bullet list', icon: 'i-lucide-list' },
    { kind: 'orderedList', label: 'Numbered list', icon: 'i-lucide-list-ordered' },
    { kind: 'taskList', label: 'Task list', icon: 'i-lucide-list-checks' },
    { kind: 'blockquote', label: 'Quote', icon: 'i-lucide-text-quote' },
    { kind: 'codeBlock', label: 'Code block', icon: 'i-lucide-square-code' },
  ],
  [
    { type: 'label', label: 'Callouts' },
    ...calloutKinds.map((callout) => ({
      kind: 'callout' as const,
      callout,
      label: calloutLabels[callout],
      description: 'Highlighted box',
      icon: calloutIcons[callout],
    })),
  ],
  [
    { type: 'label', label: 'Insert' },
    { kind: 'pageLink', label: 'Link to page', icon: 'i-lucide-file-symlink' },
    {
      kind: 'tabs',
      label: 'Tabs',
      description: 'Windows / Linux style',
      icon: 'i-lucide-panels-top-left',
    },
    {
      kind: 'mathBlock',
      label: 'Formula',
      description: 'LaTeX on its own line',
      icon: 'i-lucide-sigma',
    },
    { kind: 'mathInline', label: 'Inline formula', icon: 'i-lucide-radical' },
    { kind: 'table', label: 'Table', icon: 'i-lucide-table' },
    { kind: 'media', label: 'Image or video', icon: 'i-lucide-image-plus' },
    { kind: 'attachment', label: 'File attachment', icon: 'i-lucide-paperclip' },
    { kind: 'horizontalRule', label: 'Divider', icon: 'i-lucide-separator-horizontal' },
  ],
]

export type DocEditorMode = 'visual' | 'source' | 'preview'

export const docEditorModes = [
  { label: 'Write', value: 'visual', icon: 'i-lucide-pencil' },
  { label: 'Markdown', value: 'source', icon: 'i-lucide-file-code' },
  { label: 'Preview', value: 'preview', icon: 'i-lucide-eye' },
] satisfies { label: string; value: DocEditorMode; icon: string }[]
