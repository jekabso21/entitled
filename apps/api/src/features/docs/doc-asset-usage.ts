import type { DocAsset } from '@entitled/contracts/docs'
import type { Queryable } from '@entitled/db'
import { docAssets, docPages } from '@entitled/db/schema'
import { desc, eq } from 'drizzle-orm'
import { docAssetUrl } from './create-doc-asset.ts'

const ASSET_LINK = /\/api\/doc-assets\/([0-9a-f-]{36})\//g

// Usage is read from the current text of each page, not from older versions.
export async function listDocAssets(db: Queryable, productId: string): Promise<DocAsset[]> {
  const [assets, pages] = await Promise.all([
    db
      .select()
      .from(docAssets)
      .where(eq(docAssets.productId, productId))
      .orderBy(desc(docAssets.createdAt)),
    db
      .select({ id: docPages.id, title: docPages.title, body: docPages.body })
      .from(docPages)
      .where(eq(docPages.productId, productId)),
  ])
  const usedBy = new Map<string, { id: string; title: string }[]>()
  for (const page of pages) {
    const ids = new Set([...page.body.matchAll(ASSET_LINK)].map((match) => match[1]))
    for (const id of ids) {
      if (id) usedBy.set(id, [...(usedBy.get(id) ?? []), { id: page.id, title: page.title }])
    }
  }
  return assets.map((asset) => ({
    id: asset.id,
    fileName: asset.fileName,
    contentType: asset.contentType,
    sizeBytes: asset.sizeBytes,
    url: docAssetUrl(asset.id, asset.fileName),
    createdAt: asset.createdAt.toISOString(),
    usedBy: usedBy.get(asset.id) ?? [],
  }))
}
