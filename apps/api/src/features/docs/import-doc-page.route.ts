import { docPageSchema, importDocPageInputSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { createDocPage } from './create-doc-page.ts'
import { toDocPage } from './doc-queries.ts'
import { titleFromMarkdown } from './title-from-markdown.ts'

const route = createRoute({
  method: 'post',
  path: '/products/{productId}/docs/import',
  tags: ['Docs'],
  summary: 'Create a draft page from an uploaded Markdown file',
  request: {
    params: z.object({ productId: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: importDocPageInputSchema } } },
  },
  responses: {
    201: {
      description: 'Imported page',
      content: { 'application/json': { schema: docPageSchema } },
    },
  },
})

export const importDocPageRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { productId } = c.req.valid('param')
  const { fileName, markdown } = c.req.valid('json')
  const page = await withTransaction((scope) =>
    createDocPage(scope, actor, productId, {
      title: titleFromMarkdown(markdown, fileName),
      body: markdown,
    }),
  )
  return c.json(await toDocPage(page), 201)
})
