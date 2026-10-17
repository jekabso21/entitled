import {
  createSupportAttachmentInputSchema,
  supportAttachmentUploadSchema,
} from '@entitled/contracts/support'
import { createRoute } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { createSupportAttachment } from './create-support-attachment.ts'

const route = createRoute({
  method: 'post',
  path: '/support/attachments',
  tags: ['Support'],
  summary: 'Get an upload URL for a file to attach to the next message (max 25 MB)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createSupportAttachmentInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Upload URL',
      content: { 'application/json': { schema: supportAttachmentUploadSchema } },
    },
  },
})

export const createSupportAttachmentRoute = createRouter().openapi(route, async (c) => {
  const upload = await createSupportAttachment(db, requireActor(c), c.req.valid('json'))
  return c.json(upload, 201)
})
