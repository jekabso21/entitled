import { clientAccountDetailSchema } from '@entitled/contracts/client-accounts'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { assertCanManageAccount } from '#lib/account-management-access.ts'
import { findClientAccountDetail } from './client-account-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/client-accounts/{clientAccountId}',
  tags: ['Client accounts'],
  summary: 'A client account with its members (vendor staff or its client admins)',
  request: { params: z.object({ clientAccountId: z.uuid() }) },
  responses: {
    200: {
      description: 'Client account',
      content: { 'application/json': { schema: clientAccountDetailSchema } },
    },
  },
})

export const getClientAccountRoute = createRouter().openapi(route, async (c) => {
  const actor = requireActor(c)
  const { clientAccountId } = c.req.valid('param')
  if (!actor.vendorRole) await assertCanManageAccount(db, actor, clientAccountId)
  const account = await findClientAccountDetail(db, clientAccountId)
  if (!account) throw new DomainError('not_found', 'Client account not found')
  return c.json(account, 200)
})
