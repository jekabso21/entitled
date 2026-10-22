import { MAX_DOC_PAGE_DEPTH } from '@entitled/contracts/docs'
import { DomainError } from '#lib/domain-error.ts'

type TreeNode = { id: string; parentId: string | null }

// Depth of each page (0 = top level), or null when the parent links form a loop or point
// at a page outside the set.
export function pageDepths(pages: readonly TreeNode[]): Map<string, number> | null {
  const byId = new Map(pages.map((page) => [page.id, page]))
  const depths = new Map<string, number>()
  for (const page of pages) {
    let depth = 0
    let current = page
    const seen = new Set<string>()
    while (current.parentId !== null) {
      if (seen.has(current.id)) return null
      seen.add(current.id)
      const parent = byId.get(current.parentId)
      if (!parent) return null
      current = parent
      depth += 1
    }
    depths.set(page.id, depth)
  }
  return depths
}

export function assertValidTree(pages: readonly TreeNode[]) {
  const depths = pageDepths(pages)
  if (!depths) throw new DomainError('invalid_state', 'Pages cannot be nested inside themselves')
  if ([...depths.values()].some((depth) => depth >= MAX_DOC_PAGE_DEPTH)) {
    throw new DomainError(
      'invalid_state',
      `Pages can be nested at most ${String(MAX_DOC_PAGE_DEPTH)} levels deep`,
    )
  }
  return depths
}

// A client sees a page only when it and every page above it are published, so
// unpublishing a section hides everything inside it.
export function visibleToClients<T extends TreeNode & { status: 'draft' | 'published' }>(
  pages: readonly T[],
): T[] {
  const byId = new Map(pages.map((page) => [page.id, page]))
  const isVisible = (page: T, hops = 0): boolean => {
    if (page.status !== 'published' || hops > MAX_DOC_PAGE_DEPTH) return false
    if (page.parentId === null) return true
    const parent = byId.get(page.parentId)
    return parent !== undefined && isVisible(parent, hops + 1)
  }
  return pages.filter((page) => isVisible(page))
}
