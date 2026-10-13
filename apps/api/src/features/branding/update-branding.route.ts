import { brandingSchema, updateBrandingInputSchema } from '@entitled/contracts/settings'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { updateBranding } from './update-branding.ts'

const route = createRoute({
  method: 'patch',
  path: '/branding',
  tags: ['Branding'],
  summary: 'Change portal name or colour (vendor admin)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: updateBrandingInputSchema } },
    },
  },
  responses: {
    200: { description: 'Branding', content: { 'application/json': { schema: brandingSchema } } },
  },
})

export const updateBrandingRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin'])
  const input = c.req.valid('json')
  return c.json(await withTransaction((scope) => updateBranding(scope, actor, input)), 200)
})
