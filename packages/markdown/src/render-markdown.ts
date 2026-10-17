import rehypeShiki from '@shikijs/rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { rehypeMermaidBlocks } from './rehype-mermaid-blocks.ts'
import { rehypeVideoEmbeds } from './rehype-video-embeds.ts'
import { sanitizeSchema } from './sanitize-schema.ts'

// Sanitize runs before highlighting so Shiki's trusted inline styles survive,
// while anything authored in the Markdown is still filtered.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkAlert)
  .use(remarkRehype)
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeMermaidBlocks)
  .use(rehypeVideoEmbeds)
  .use(rehypeShiki, {
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultLanguage: 'text',
    fallbackLanguage: 'text',
  })
  .use(rehypeStringify)

export async function renderMarkdown(markdown: string) {
  return String(await processor.process(markdown))
}
