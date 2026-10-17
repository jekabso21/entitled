import { createSupportThreadInputSchema, supportThreadSchema } from '@entitled/contracts/support'
import { createRoute } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { withTransaction } from '#lib/transaction.ts'
import { createSupportThread } from './create-support-thread.ts'
import { loadSupportScope } from './support-access.ts'
import { loadThreadFor } from './thread-response.ts'

const route = createRoute({
  method: 'post',
  path: '/support/threads',
  tags: ['Support'],
  summary: 'Open a support request about an entitled product (client users)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createSupportThreadInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Created thread',
      content: { 'application/json': { schema: supportThreadSchema } },
    },
  },
})

export const createSupportThreadRoute = createRouter().openapi(route, async (c) => {
  const actor = requireActor(c)
  const input = c.req.valid('json')
  const threadId = await withTransaction((scope) => createSupportThread(scope, actor, input))
  return c.json(await loadThreadFor(await loadSupportScope(db, actor), threadId), 201)
})
