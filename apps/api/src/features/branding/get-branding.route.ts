import { brandingSchema } from '@entitled/contracts/settings'
import { createRoute } from '@hono/zod-openapi'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { getBranding } from '#lib/install-settings.ts'

const route = createRoute({
  method: 'get',
  path: '/branding',
  tags: ['Branding'],
  summary: 'Portal name, colour and logo URL (public, used before sign-in)',
  responses: {
    200: { description: 'Branding', content: { 'application/json': { schema: brandingSchema } } },
  },
})

export const getBrandingRoute = createRouter().openapi(route, async (c) =>
  c.json(await getBranding(db), 200),
)
