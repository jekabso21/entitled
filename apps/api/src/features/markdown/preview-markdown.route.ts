import { markdownPreviewInputSchema, markdownPreviewSchema } from '@entitled/contracts/markdown'
import { createRoute } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { renderMarkdownCached } from '#lib/markdown.ts'

const route = createRoute({
  method: 'post',
  path: '/markdown/preview',
  tags: ['Markdown'],
  summary: 'Render Markdown exactly as it will be shown (any signed-in user)',
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
  requireActor(c)
  return c.json({ html: await renderMarkdownCached(c.req.valid('json').markdown) }, 200)
})
