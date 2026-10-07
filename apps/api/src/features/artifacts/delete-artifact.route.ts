import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { deleteStoredObject } from '#lib/artifact-storage.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { deleteArtifact } from './delete-artifact.ts'

const route = createRoute({
  method: 'delete',
  path: '/artifacts/{artifactId}',
  tags: ['Artifacts'],
  summary: 'Remove a file from a draft release',
  request: { params: z.object({ artifactId: z.uuid() }) },
  responses: { 204: { description: 'Removed' } },
})

export const deleteArtifactRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { artifactId } = c.req.valid('param')
  const storageKey = await withTransaction((scope) => deleteArtifact(scope, actor, artifactId))
  // Deleted after commit: a failure here leaves an orphaned object, never a dangling row.
  await deleteStoredObject(storageKey).catch((err: unknown) => {
    console.error({ requestId: c.get('requestId'), storageKey, err })
  })
  return c.body(null, 204)
})
