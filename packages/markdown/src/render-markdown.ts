import rehypeShiki from '@shikijs/rehype'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { rehypeDocTabs } from './rehype-doc-tabs.ts'
import { type DocHeading, rehypeHeadingAnchors } from './rehype-heading-anchors.ts'
import { rehypeMermaidBlocks } from './rehype-mermaid-blocks.ts'
import { rehypeVideoEmbeds } from './rehype-video-embeds.ts'
import { sanitizeSchema } from './sanitize-schema.ts'

export type { DocHeading } from './rehype-heading-anchors.ts'

export type RenderedDocument = { html: string; headings: DocHeading[] }

// Sanitize runs before the plugins that add markup (tabs, anchors, KaTeX, Shiki), so their
// trusted output survives while anything authored in the Markdown is still filtered.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkAlert)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeDocTabs)
  .use(rehypeHeadingAnchors)
  .use(rehypeMermaidBlocks)
  .use(rehypeVideoEmbeds)
  .use(rehypeKatex, { strict: 'ignore' })
  .use(rehypeShiki, {
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultLanguage: 'text',
    fallbackLanguage: 'text',
  })
  .use(rehypeStringify)

export async function renderDocument(markdown: string): Promise<RenderedDocument> {
  const file = await processor.process(markdown)
  return { html: String(file), headings: file.data.headings ?? [] }
}

export async function renderMarkdown(markdown: string) {
  return (await renderDocument(markdown)).html
}
