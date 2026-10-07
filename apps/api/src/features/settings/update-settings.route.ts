import {
  installSettingsSchema,
  updateInstallSettingsInputSchema,
} from '@entitled/contracts/settings'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { updateSettings } from './update-settings.ts'

const route = createRoute({
  method: 'patch',
  path: '/settings',
  tags: ['Settings'],
  summary: 'Change install-wide settings (vendor admin)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: updateInstallSettingsInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Settings',
      content: { 'application/json': { schema: installSettingsSchema } },
    },
  },
})

export const updateSettingsRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin'])
  const input = c.req.valid('json')
  return c.json(await withTransaction((scope) => updateSettings(scope, actor, input)), 200)
})
