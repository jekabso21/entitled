import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { resolveArtifactDownload } from './resolve-artifact-download.ts'

const route = createRoute({
  method: 'get',
  path: '/artifacts/{artifactId}/download',
  tags: ['Artifacts'],
  summary: 'Redirect to a short-lived download URL for an entitled artifact',
  request: { params: z.object({ artifactId: z.uuid() }) },
  responses: { 302: { description: 'Redirect to the file' } },
})

export const downloadArtifactRoute = createRouter().openapi(route, async (c) => {
  const url = await resolveArtifactDownload(db, requireActor(c), c.req.valid('param').artifactId)
  return c.redirect(url, 302)
})
