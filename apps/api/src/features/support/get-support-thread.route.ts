import { supportThreadSchema } from '@entitled/contracts/support'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { loadSupportScope } from './support-access.ts'
import { findSupportThread } from './support-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/support/threads/{threadId}',
  tags: ['Support'],
  summary: 'A thread with its messages (internal notes only for vendor staff)',
  request: { params: z.object({ threadId: z.uuid() }) },
  responses: {
    200: {
      description: 'Thread',
      content: { 'application/json': { schema: supportThreadSchema } },
    },
  },
})

export const getSupportThreadRoute = createRouter().openapi(route, async (c) => {
  const scope = await loadSupportScope(db, requireActor(c))
  const thread = await findSupportThread(db, scope, c.req.valid('param').threadId)
  if (!thread) throw new DomainError('not_found', 'Thread not found')
  return c.json(thread, 200)
})
