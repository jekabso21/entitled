import type { Product } from '@entitled/contracts/products'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createProductWithRevisions } from '#test/catalog-fixtures.ts'
import { createSignedInUser, jsonRequest, uniqueSuffix } from '#test/test-users.ts'

describe('products', () => {
  const app = createApp()
  let editorCookie: string
  let supportCookie: string

  beforeAll(async () => {
    editorCookie = (await createSignedInUser({ vendorRole: 'editor' })).cookie
    supportCookie = (await createSignedInUser({ vendorRole: 'support' })).cookie
  })

  it('lets an editor create a product and appends revisions in order', async () => {
    const product = await createProductWithRevisions(editorCookie, ['A', 'B', 'C'])
    expect(product.revisions.map((revision) => [revision.code, revision.position])).toEqual([
      ['A', 1],
      ['B', 2],
      ['C', 3],
    ])
  })

  it('rejects a duplicate revision code with 409', async () => {
    const product = await createProductWithRevisions(editorCookie, ['A'])
    const res = await app.request(
      `/api/products/${product.id}/revisions`,
      jsonRequest('POST', { code: 'A', name: 'Again' }, editorCookie),
    )
    expect(res.status).toBe(409)
  })

  it('does not let support staff change the catalog', async () => {
    const res = await app.request(
      '/api/products',
      jsonRequest('POST', { name: 'Nope', slug: `nope-${uniqueSuffix()}` }, supportCookie),
    )
    expect(res.status).toBe(403)
  })

  it('shows vendor staff every product', async () => {
    const product = await createProductWithRevisions(editorCookie, [])
    const res = await app.request('/api/products', { headers: { cookie: supportCookie } })
    const products = (await res.json()) as Product[]
    expect(products.some((item) => item.id === product.id)).toBe(true)
  })
})
