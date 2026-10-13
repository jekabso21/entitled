import { brandingSchema } from '@entitled/contracts/settings'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { updateBranding } from './update-branding.ts'

const route = createRoute({
  method: 'delete',
  path: '/branding/logo',
  tags: ['Branding'],
  summary: 'Remove the logo (vendor admin)',
  responses: {
    200: { description: 'Branding', content: { 'application/json': { schema: brandingSchema } } },
  },
})

export const deleteLogoRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin'])
  return c.json(await withTransaction((scope) => updateBranding(scope, actor, { logo: null })), 200)
})
