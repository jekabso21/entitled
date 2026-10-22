import type { HardwareRevision } from '@entitled/contracts/products'

type RevisionRange = { minRevisionId: string | null; maxRevisionId: string | null }

export function revisionRangeLabel(range: RevisionRange, revisions: readonly HardwareRevision[]) {
  const code = (id: string | null) => revisions.find((revision) => revision.id === id)?.code
  const min = code(range.minRevisionId)
  const max = code(range.maxRevisionId)
  if (min && max) return min === max ? `Rev ${min} only` : `Rev ${min} to Rev ${max}`
  if (min) return `Rev ${min} and newer`
  if (max) return `Rev ${max} and older`
  return null
}
