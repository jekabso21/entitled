import {
  clientAccountSchema,
  createClientAccountInputSchema,
} from '@entitled/contracts/client-accounts'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { createClientAccount } from './create-client-account.ts'

const route = createRoute({
  method: 'post',
  path: '/client-accounts',
  tags: ['Client accounts'],
  summary: 'Create a client account (vendor admin)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createClientAccountInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Created client account',
      content: { 'application/json': { schema: clientAccountSchema } },
    },
  },
})

export const createClientAccountRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin'])
  const input = c.req.valid('json')
  const account = await withTransaction((scope) => createClientAccount(scope, actor, input))
  return c.json(account, 201)
})
