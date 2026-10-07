import type { ProductAccess } from '#lib/product-access.ts'

type RevisionPosition = { id: string; position: number }

type ReleaseRange = {
  productId: string
  status: 'draft' | 'published' | 'archived'
  minRevisionId: string | null
  maxRevisionId: string | null
}

// Vendor staff see every release. A client sees a published release when it targets at
// least one revision they are entitled to; a missing bound leaves that side open.
export function isReleaseVisible(
  access: ProductAccess,
  release: ReleaseRange,
  productRevisions: readonly RevisionPosition[],
) {
  if (access.kind === 'all') return true
  if (release.status !== 'published') return false

  const accessible = access.products.get(release.productId)
  if (accessible === undefined) return false
  if (accessible === null) return true

  const positionOf = (id: string | null) =>
    id ? productRevisions.find((revision) => revision.id === id)?.position : undefined
  const min = positionOf(release.minRevisionId) ?? Number.NEGATIVE_INFINITY
  const max = positionOf(release.maxRevisionId) ?? Number.POSITIVE_INFINITY

  return productRevisions.some(
    (revision) =>
      accessible.has(revision.id) && revision.position >= min && revision.position <= max,
  )
}
