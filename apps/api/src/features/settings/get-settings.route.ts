import { installSettingsSchema } from '@entitled/contracts/settings'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { getInstallSettings } from '#lib/install-settings.ts'

const route = createRoute({
  method: 'get',
  path: '/settings',
  tags: ['Settings'],
  summary: 'Install-wide settings (vendor staff)',
  responses: {
    200: {
      description: 'Settings',
      content: { 'application/json': { schema: installSettingsSchema } },
    },
  },
})

export const getSettingsRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin', 'editor', 'support'])
  return c.json(await getInstallSettings(db), 200)
})
