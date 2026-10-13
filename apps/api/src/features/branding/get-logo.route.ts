import { installSettings } from '@entitled/db/schema'
import { createRoute } from '@hono/zod-openapi'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'

const route = createRoute({
  method: 'get',
  path: '/branding/logo',
  tags: ['Branding'],
  summary: 'The logo image (public)',
  responses: { 200: { description: 'Image bytes' } },
})

export const getLogoRoute = createRouter().openapi(route, async (c) => {
  const [row] = await db
    .select({ logo: installSettings.logo, contentType: installSettings.logoContentType })
    .from(installSettings)
  if (!row?.logo || !row.contentType) throw new DomainError('not_found', 'No logo set')

  // URLs carry a version parameter, so the image itself can be cached for a long time.
  return c.body(new Uint8Array(row.logo), 200, {
    'content-type': row.contentType,
    'cache-control': 'public, max-age=31536000, immutable',
    'content-security-policy': "default-src 'none'",
    'x-content-type-options': 'nosniff',
  })
})
