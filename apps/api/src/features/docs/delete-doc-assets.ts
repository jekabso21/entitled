import { docAssets } from '@entitled/db/schema'
import { inArray } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { listDocAssets } from './doc-asset-usage.ts'

// Deletes files no page links to. `assetIds` null means every unused file of the product.
// Returns the storage keys to remove once the transaction has committed.
export async function deleteDocAssets(
  { tx }: TransactionScope,
  actor: Actor,
  productId: string,
  assetIds: readonly string[] | null,
) {
  const assets = await listDocAssets(tx, productId)
  const targets = assetIds ? assets.filter((asset) => assetIds.includes(asset.id)) : assets
  if (assetIds && targets.length !== assetIds.length) {
    throw new DomainError('not_found', 'File not found')
  }
  const inUse = targets.find((asset) => asset.usedBy.length)
  if (assetIds && inUse) {
    throw new DomainError('conflict', `${inUse.fileName} is still used on a page`)
  }
  const unused = targets.filter((asset) => !asset.usedBy.length)
  if (!unused.length) return []

  const removed = await tx
    .delete(docAssets)
    .where(
      inArray(
        docAssets.id,
        unused.map((asset) => asset.id),
      ),
    )
    .returning({ storageKey: docAssets.storageKey })
  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'doc_assets.deleted',
    subjectType: 'product',
    subjectId: productId,
    metadata: { files: unused.map((asset) => asset.fileName) },
  })
  return removed.map((row) => row.storageKey)
}
