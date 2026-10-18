import type { CreateDocAssetInput, DocAssetUpload } from '@entitled/contracts/docs'
import type { Db } from '@entitled/db'
import { docAssets, products } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { DomainError } from '#lib/domain-error.ts'
import { presignUpload } from '#lib/object-storage.ts'

export function docAssetUrl(assetId: string, fileName: string) {
  return `/api/doc-assets/${assetId}/${fileName}`
}

export async function createDocAsset(
  db: Db,
  actor: Actor,
  productId: string,
  input: CreateDocAssetInput,
): Promise<DocAssetUpload> {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
  if (!product) throw new DomainError('not_found', 'Product not found')

  const id = crypto.randomUUID()
  const storageKey = `docs/${productId}/${id}/${input.fileName}`
  await db.insert(docAssets).values({
    id,
    productId,
    fileName: input.fileName,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    storageKey,
    uploadedByUserId: actor.userId,
  })
  const upload = await presignUpload(storageKey, input.contentType, input.sizeBytes)
  return {
    assetId: id,
    url: docAssetUrl(id, input.fileName),
    uploadUrl: upload.url,
    uploadHeaders: upload.headers,
  }
}
