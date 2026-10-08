import { z } from 'zod'

export const markdownPreviewInputSchema = z.strictObject({
  markdown: z.string().max(200_000),
})

export const markdownPreviewSchema = z.object({ html: z.string() })

export type MarkdownPreview = z.infer<typeof markdownPreviewSchema>
