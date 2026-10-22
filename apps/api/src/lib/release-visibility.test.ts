import { describe, expect, it } from 'vitest'
import type { ProductAccess } from '#lib/product-access.ts'
import { isReleaseVisible } from '#lib/release-visibility.ts'

const revisions = [
  { id: 'rev-a', position: 1 },
  { id: 'rev-b', position: 2 },
  { id: 'rev-c', position: 3 },
]
const release = {
  productId: 'p1',
  status: 'published' as const,
  audience: 'entitled' as const,
  clientAccounts: [],
  minRevisionId: 'rev-b',
  maxRevisionId: null,
}
const scoped = (revisionIds: string[] | null, clientAccountIds = ['acme']): ProductAccess => ({
  kind: 'scoped',
  products: new Map([['p1', revisionIds ? new Set(revisionIds) : null]]),
  clientAccountIds: new Set(clientAccountIds),
})

describe('isReleaseVisible', () => {
  it('shows a ranged release to a client entitled to a revision inside the range', () => {
    expect(isReleaseVisible(scoped(['rev-c']), release, revisions)).toBe(true)
  })

  it('hides a ranged release from a client whose revisions are all outside it', () => {
    expect(isReleaseVisible(scoped(['rev-a']), release, revisions)).toBe(false)
  })

  it('shows any published release to a client entitled to every revision', () => {
    expect(isReleaseVisible(scoped(null), release, revisions)).toBe(true)
  })

  it('hides drafts from clients but not from vendor staff', () => {
    const draft = { ...release, status: 'draft' as const }
    expect(isReleaseVisible(scoped(null), draft, revisions)).toBe(false)
    expect(isReleaseVisible({ kind: 'all' }, draft, revisions)).toBe(true)
  })

  it('hides releases of products the client has no entitlement for', () => {
    const other: ProductAccess = {
      kind: 'scoped',
      products: new Map(),
      clientAccountIds: new Set(['acme']),
    }
    expect(isReleaseVisible(other, release, revisions)).toBe(false)
  })

  it('shows a release for selected accounts only to clients of those accounts', () => {
    const selected = { ...release, audience: 'selected' as const, clientAccounts: [{ id: 'acme' }] }
    expect(isReleaseVisible(scoped(null, ['acme']), selected, revisions)).toBe(true)
    expect(isReleaseVisible(scoped(null, ['globex']), selected, revisions)).toBe(false)
    expect(isReleaseVisible({ kind: 'all' }, selected, revisions)).toBe(true)
  })

  it('still requires the product entitlement for a release for selected accounts', () => {
    const selected = { ...release, audience: 'selected' as const, clientAccounts: [{ id: 'acme' }] }
    expect(isReleaseVisible(scoped(['rev-a'], ['acme']), selected, revisions)).toBe(false)
  })
})
