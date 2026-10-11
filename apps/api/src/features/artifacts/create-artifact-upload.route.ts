import { artifactUploadSchema, createArtifactUploadInputSchema } from '@entitled/contracts/releases'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { createArtifactUpload } from './create-artifact-upload.ts'

const route = createRoute({
  method: 'post',
  path: '/releases/{releaseId}/artifacts',
  tags: ['Artifacts'],
  summary: 'Start an artifact upload; PUT the file to the returned URL, then complete it',
  request: {
    params: z.object({ releaseId: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: createArtifactUploadInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Upload URL',
      content: { 'application/json': { schema: artifactUploadSchema } },
    },
  },
})

export const createArtifactUploadRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'], { allowApiKey: true })
  const { releaseId } = c.req.valid('param')
  const input = c.req.valid('json')
  const upload = await withTransaction((scope) =>
    createArtifactUpload(scope, actor, releaseId, input),
  )
  return c.json(upload, 201)
})
