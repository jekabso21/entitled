import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { resolveSupportAttachmentDownload } from './resolve-attachment-download.ts'

const route = createRoute({
  method: 'get',
  path: '/support/attachments/{attachmentId}/download',
  tags: ['Support'],
  summary: 'Redirect to a short-lived download URL for an attachment',
  request: { params: z.object({ attachmentId: z.uuid() }) },
  responses: { 302: { description: 'Redirect to the file' } },
})

export const downloadSupportAttachmentRoute = createRouter().openapi(route, async (c) => {
  const url = await resolveSupportAttachmentDownload(
    db,
    requireActor(c),
    c.req.valid('param').attachmentId,
  )
  return c.redirect(url, 302)
})
