import {
  supportThreadListQuerySchema,
  supportThreadSummarySchema,
} from '@entitled/contracts/support'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { loadSupportScope } from './support-access.ts'
import { listSupportThreads } from './support-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/support/threads',
  tags: ['Support'],
  summary: 'Support threads visible to the caller, most recent activity first',
  request: { query: supportThreadListQuerySchema },
  responses: {
    200: {
      description: 'Threads',
      content: { 'application/json': { schema: z.array(supportThreadSummarySchema) } },
    },
  },
})

export const listSupportThreadsRoute = createRouter().openapi(route, async (c) => {
  const scope = await loadSupportScope(db, requireActor(c))
  return c.json(await listSupportThreads(db, scope, c.req.valid('query').status), 200)
})
