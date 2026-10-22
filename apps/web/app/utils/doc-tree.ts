import { type DocPageSummary, MAX_DOC_PAGE_DEPTH } from '@entitled/contracts/docs'

export type DocTreeRow = { page: DocPageSummary; depth: number; hasChildren: boolean }
export type DocDropPlacement = 'before' | 'after' | 'inside'
type TreeLink = { id: string; parentId: string | null }

// Pages in reading order (parents before their children), with their nesting depth. Pages
// whose parent is missing from the list (e.g. hidden from a client) are left out.
export function flattenDocTree(pages: readonly DocPageSummary[]): DocTreeRow[] {
  const children = new Map<string | null, DocPageSummary[]>()
  for (const page of pages) {
    const siblings = children.get(page.parentId) ?? []
    siblings.push(page)
    children.set(page.parentId, siblings)
  }
  const rows: DocTreeRow[] = []
  const visit = (parentId: string | null, depth: number) => {
    const siblings = [...(children.get(parentId) ?? [])].sort((a, b) => a.position - b.position)
    for (const page of siblings) {
      rows.push({ page, depth, hasChildren: children.has(page.id) })
      if (depth < MAX_DOC_PAGE_DEPTH) visit(page.id, depth + 1)
    }
  }
  visit(null, 0)
  return rows
}

export function descendantIds(pages: readonly DocPageSummary[], id: string): Set<string> {
  const found = new Set<string>()
  const queue = [id]
  while (queue.length > 0) {
    const current = queue.shift()
    for (const page of pages) {
      if (page.parentId === current && !found.has(page.id)) {
        found.add(page.id)
        queue.push(page.id)
      }
    }
  }
  return found
}

function subtreeHeight(pages: readonly DocPageSummary[], id: string): number {
  const below = pages.filter((page) => page.parentId === id)
  return below.length === 0
    ? 0
    : 1 + Math.max(...below.map((page) => subtreeHeight(pages, page.id)))
}

// The full tree after moving `id` next to or into `targetId`, or null when the move would
// put a page inside itself or nest deeper than allowed.
export function moveDocPage(
  pages: readonly DocPageSummary[],
  id: string,
  targetId: string,
  placement: DocDropPlacement,
): TreeLink[] | null {
  if (id === targetId || descendantIds(pages, id).has(targetId)) return null
  const rows = flattenDocTree(pages)
  const target = rows.find((row) => row.page.id === targetId)
  const moving = pages.find((page) => page.id === id)
  if (!target || !moving) return null

  const newParentId = placement === 'inside' ? targetId : target.page.parentId
  const newDepth = placement === 'inside' ? target.depth + 1 : target.depth
  if (newDepth + subtreeHeight(pages, id) >= MAX_DOC_PAGE_DEPTH) return null

  const siblingsOf = (parentId: string | null) =>
    rows
      .filter((row) => row.page.parentId === parentId && row.page.id !== id)
      .map((row) => row.page.id)
  const order = new Map<string | null, string[]>()
  for (const row of rows) {
    if (!order.has(row.page.parentId)) order.set(row.page.parentId, siblingsOf(row.page.parentId))
  }
  const siblings = order.get(newParentId) ?? siblingsOf(newParentId)
  if (placement === 'inside') siblings.push(id)
  else {
    const index = siblings.indexOf(targetId)
    siblings.splice(placement === 'before' ? index : index + 1, 0, id)
  }
  order.set(newParentId, siblings)

  const result: TreeLink[] = []
  const visit = (parentId: string | null) => {
    for (const childId of order.get(parentId) ?? []) {
      result.push({ id: childId, parentId })
      visit(childId)
    }
  }
  visit(null)
  return result
}
