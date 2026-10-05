import { clientAccountDetailSchema } from '@entitled/contracts/client-accounts'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { findClientAccountDetail } from './client-account-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/client-accounts/{clientAccountId}',
  tags: ['Client accounts'],
  summary: 'A client account with its members (vendor staff)',
  request: { params: z.object({ clientAccountId: z.uuid() }) },
  responses: {
    200: {
      description: 'Client account',
      content: { 'application/json': { schema: clientAccountDetailSchema } },
    },
  },
})

export const getClientAccountRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin', 'editor', 'support'])
  const account = await findClientAccountDetail(db, c.req.valid('param').clientAccountId)
  if (!account) throw new DomainError('not_found', 'Client account not found')
  return c.json(account, 200)
})
