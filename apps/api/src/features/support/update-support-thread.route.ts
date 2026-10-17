import { supportThreadSchema, updateSupportThreadInputSchema } from '@entitled/contracts/support'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { withTransaction } from '#lib/transaction.ts'
import { loadSupportScope } from './support-access.ts'
import { loadThreadFor } from './thread-response.ts'
import { updateSupportThreadStatus } from './update-support-thread.ts'

const route = createRoute({
  method: 'patch',
  path: '/support/threads/{threadId}',
  tags: ['Support'],
  summary: 'Change a thread status (resolve or reopen)',
  request: {
    params: z.object({ threadId: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updateSupportThreadInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated thread',
      content: { 'application/json': { schema: supportThreadSchema } },
    },
  },
})

export const updateSupportThreadRoute = createRouter().openapi(route, async (c) => {
  const actor = requireActor(c)
  const { threadId } = c.req.valid('param')
  const { status } = c.req.valid('json')
  await withTransaction((scope) => updateSupportThreadStatus(scope, actor, threadId, status))
  return c.json(await loadThreadFor(await loadSupportScope(db, actor), threadId), 200)
})
