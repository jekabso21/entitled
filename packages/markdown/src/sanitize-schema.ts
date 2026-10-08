import { defaultSchema, type Options } from 'rehype-sanitize'

// GitHub's defaults plus the classes our pipeline relies on: code languages for
// highlighting, mermaid blocks and GitHub-style alerts.
export const sanitizeSchema: Options = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-[\w-]+$/]],
    div: [...(defaultSchema.attributes?.div ?? []), ['className', /^markdown-alert(-\w+)?$/]],
    p: [...(defaultSchema.attributes?.p ?? []), ['className', 'markdown-alert-title']],
    svg: ['className', 'viewBox', 'width', 'height', 'ariaHidden'],
    path: ['d', 'fillRule'],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), 'svg', 'path'],
}
