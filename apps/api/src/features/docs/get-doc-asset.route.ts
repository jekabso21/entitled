import { docMediaContentTypes } from '@entitled/contracts/docs'
import { docAssets } from '@entitled/db/schema'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { presignDownload } from '#lib/object-storage.ts'
import { canSeeProduct, loadProductAccess } from '#lib/product-access.ts'

const route = createRoute({
  method: 'get',
  path: '/doc-assets/{assetId}/{fileName}',
  tags: ['Docs'],
  summary: 'Redirect to an embedded image, video or attachment for people who can see the product',
  request: { params: z.object({ assetId: z.uuid(), fileName: z.string() }) },
  responses: { 302: { description: 'Redirect to the file' } },
})

export const getDocAssetRoute = createRouter().openapi(route, async (c) => {
  const access = await loadProductAccess(db, requireActor(c))
  const [asset] = await db
    .select()
    .from(docAssets)
    .where(eq(docAssets.id, c.req.valid('param').assetId))
  if (!asset || !canSeeProduct(access, asset.productId)) {
    throw new DomainError('not_found', 'Asset not found')
  }
  c.header('cache-control', 'private, max-age=600')
  const inlineTypes: readonly string[] = [...docMediaContentTypes, 'application/pdf']
  const disposition = inlineTypes.includes(asset.contentType) ? 'inline' : 'attachment'
  return c.redirect(await presignDownload(asset.storageKey, asset.fileName, disposition), 302)
})
