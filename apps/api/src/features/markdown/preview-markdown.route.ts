import { markdownPreviewInputSchema, markdownPreviewSchema } from '@entitled/contracts/markdown'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { renderMarkdownCached } from '#lib/markdown.ts'

const route = createRoute({
  method: 'post',
  path: '/markdown/preview',
  tags: ['Markdown'],
  summary: 'Render Markdown exactly as clients will see it (vendor staff)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: markdownPreviewInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Rendered HTML',
      content: { 'application/json': { schema: markdownPreviewSchema } },
    },
  },
})

export const previewMarkdownRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin', 'editor', 'support'])
  return c.json({ html: await renderMarkdownCached(c.req.valid('json').markdown) }, 200)
})
