import { artifactStatusSchema } from '@entitled/contracts/releases'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { completeArtifactUpload } from './complete-artifact-upload.ts'

const route = createRoute({
  method: 'post',
  path: '/artifacts/{artifactId}/complete',
  tags: ['Artifacts'],
  summary: 'Confirm the file was uploaded; its SHA-256 is then computed in the background',
  request: { params: z.object({ artifactId: z.uuid() }) },
  responses: {
    200: {
      description: 'Upload status',
      content: { 'application/json': { schema: z.object({ status: artifactStatusSchema }) } },
    },
  },
})

export const completeArtifactUploadRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin', 'editor'], { allowApiKey: true })
  const { artifactId } = c.req.valid('param')
  const status = await withTransaction((scope) => completeArtifactUpload(scope, artifactId))
  return c.json({ status }, 200)
})
