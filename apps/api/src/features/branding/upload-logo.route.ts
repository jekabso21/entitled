import { brandingSchema, logoContentTypes, MAX_LOGO_BYTES } from '@entitled/contracts/settings'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { DomainError } from '#lib/domain-error.ts'
import { withTransaction } from '#lib/transaction.ts'
import { updateBranding } from './update-branding.ts'

const route = createRoute({
  method: 'put',
  path: '/branding/logo',
  tags: ['Branding'],
  summary: 'Replace the logo with the raw image body (PNG, JPEG or WebP, max 512 KB)',
  responses: {
    200: { description: 'Branding', content: { 'application/json': { schema: brandingSchema } } },
  },
})

function isLogoContentType(value: string): value is (typeof logoContentTypes)[number] {
  return (logoContentTypes as readonly string[]).includes(value)
}

export const uploadLogoRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin'])
  // SVG is excluded on purpose: it can carry scripts and is served from the portal origin.
  const contentType = c.req.header('content-type')?.split(';')[0]?.trim() ?? ''
  if (!isLogoContentType(contentType)) {
    throw new DomainError('invalid_state', 'Upload a PNG, JPEG or WebP image')
  }
  const bytes = Buffer.from(await c.req.arrayBuffer())
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_LOGO_BYTES) {
    throw new DomainError('invalid_state', 'The logo must be at most 512 KB')
  }
  const branding = await withTransaction((scope) =>
    updateBranding(scope, actor, { logo: { bytes, contentType } }),
  )
  return c.json(branding, 200)
})
