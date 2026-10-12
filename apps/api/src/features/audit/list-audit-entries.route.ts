import { auditPageSchema, auditQuerySchema } from '@entitled/contracts/audit'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { listAuditEntries } from './audit-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/audit-log',
  tags: ['Audit'],
  summary: 'Admin actions and downloads, newest first (vendor admin)',
  request: { query: auditQuerySchema },
  responses: {
    200: {
      description: 'One page of entries',
      content: { 'application/json': { schema: auditPageSchema } },
    },
  },
})

export const listAuditEntriesRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin'])
  return c.json(await listAuditEntries(db, c.req.valid('query')), 200)
})
