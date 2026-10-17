import { postSupportMessageInputSchema, supportThreadSchema } from '@entitled/contracts/support'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { withTransaction } from '#lib/transaction.ts'
import { postSupportMessage } from './post-support-message.ts'
import { loadSupportScope } from './support-access.ts'
import { loadThreadFor } from './thread-response.ts'

const route = createRoute({
  method: 'post',
  path: '/support/threads/{threadId}/messages',
  tags: ['Support'],
  summary: 'Reply in a thread; vendor staff can also add internal notes',
  request: {
    params: z.object({ threadId: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: postSupportMessageInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated thread',
      content: { 'application/json': { schema: supportThreadSchema } },
    },
  },
})

export const postSupportMessageRoute = createRouter().openapi(route, async (c) => {
  const actor = requireActor(c)
  const { threadId } = c.req.valid('param')
  const input = c.req.valid('json')
  await withTransaction((scope) => postSupportMessage(scope, actor, threadId, input))
  return c.json(await loadThreadFor(await loadSupportScope(db, actor), threadId), 200)
})
