import type { Editor } from '@tiptap/vue-3'

type Actions = {
  pickFiles: (editor: Editor, kind: 'media' | 'attachment') => void
  editMath: (target: MathTarget) => void
  linkPage: () => void
}

const always = () => true
const never = () => false

// Nuxt UI calls .run() on whatever execute returns, so actions that open a picker or modal
// hand back an empty chain.
export function useDocEditorHandlers(actions: Actions): DocEditorHandlers {
  const opener = (open: (editor: Editor) => void) => ({
    canExecute: always,
    isActive: never,
    execute: (editor: Editor) => {
      open(editor)
      return editor.chain()
    },
  })
  const insertMarkdown = (markdown: (item: unknown) => string) => ({
    canExecute: always,
    isActive: never,
    execute: (editor: Editor, item: unknown) =>
      editor.chain().focus().insertContent(markdown(item), { contentType: 'markdown' }),
  })

  return {
    attachment: opener((editor) => {
      actions.pickFiles(editor, 'attachment')
    }),
    media: opener((editor) => {
      actions.pickFiles(editor, 'media')
    }),
    mathBlock: opener(() => {
      actions.editMath({ kind: 'block', latex: '' })
    }),
    mathInline: opener(() => {
      actions.editMath({ kind: 'inline', latex: '' })
    }),
    pageLink: opener(() => {
      actions.linkPage()
    }),
    callout: insertMarkdown((item) => calloutMarkdown(calloutOf(item))),
    tabs: insertMarkdown(() => TABS_MARKDOWN),
    table: {
      canExecute: (editor: Editor) => editor.can().insertTable({ rows: 3, cols: 3 }),
      execute: (editor: Editor) =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
      isActive: (editor: Editor) => editor.isActive('table'),
    },
  }
}
