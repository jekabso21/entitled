import type { Entitlement } from '@entitled/contracts/entitlements'
import type { Product } from '@entitled/contracts/products'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createProductWithRevisions } from '#test/catalog-fixtures.ts'
import { createClientAccountWith, createSignedInUser, jsonRequest } from '#test/test-users.ts'

describe('entitlements gate client access to products', () => {
  const app = createApp()
  let adminCookie: string
  let client: Awaited<ReturnType<typeof createSignedInUser>>
  let clientAccountId: string
  let otherClient: Awaited<ReturnType<typeof createSignedInUser>>

  beforeAll(async () => {
    adminCookie = (await createSignedInUser({ vendorRole: 'admin' })).cookie
    client = await createSignedInUser()
    clientAccountId = await createClientAccountWith(client.id, 'member')
    otherClient = await createSignedInUser()
    await createClientAccountWith(otherClient.id, 'admin')
  })

  const grant = (body: object, cookie = adminCookie) =>
    app.request('/api/entitlements', jsonRequest('POST', body, cookie))
  const productsSeenBy = async (cookie: string) =>
    (await (await app.request('/api/products', { headers: { cookie } })).json()) as Product[]

  it('hides products a client is not entitled to, in lists and by id', async () => {
    const product = await createProductWithRevisions(adminCookie, ['A'])

    expect((await productsSeenBy(client.cookie)).map((item) => item.id)).not.toContain(product.id)
    const byId = await app.request(`/api/products/${product.id}`, {
      headers: { cookie: client.cookie },
    })
    expect(byId.status).toBe(404)
  })

  it('shows an entitled product with all revisions to members of that account only', async () => {
    const product = await createProductWithRevisions(adminCookie, ['A', 'B'])
    expect((await grant({ clientAccountId, productId: product.id })).status).toBe(200)

    const seen = (await productsSeenBy(client.cookie)).find((item) => item.id === product.id)
    expect(seen?.revisions.map((revision) => revision.code)).toEqual(['A', 'B'])
    expect((await productsSeenBy(otherClient.cookie)).map((item) => item.id)).not.toContain(
      product.id,
    )
  })

  it('limits a client to the granted revisions', async () => {
    const product = await createProductWithRevisions(adminCookie, ['A', 'B', 'C'])
    const revisionB = product.revisions.find((revision) => revision.code === 'B')
    await grant({ clientAccountId, productId: product.id, revisionIds: [revisionB?.id] })

    const res = await app.request(`/api/products/${product.id}`, {
      headers: { cookie: client.cookie },
    })
    const seen = (await res.json()) as Product
    expect(seen.revisions.map((revision) => revision.code)).toEqual(['B'])
  })

  it('removes access when the entitlement is revoked', async () => {
    const product = await createProductWithRevisions(adminCookie, [])
    const entitlement = (await (
      await grant({ clientAccountId, productId: product.id })
    ).json()) as Entitlement

    const revoked = await app.request(`/api/entitlements/${entitlement.id}`, {
      method: 'DELETE',
      headers: { cookie: adminCookie },
    })
    expect(revoked.status).toBe(204)
    expect((await productsSeenBy(client.cookie)).map((item) => item.id)).not.toContain(product.id)
  })

  it('rejects revisions that belong to another product', async () => {
    const product = await createProductWithRevisions(adminCookie, ['A'])
    const other = await createProductWithRevisions(adminCookie, ['A'])
    const res = await grant({
      clientAccountId,
      productId: product.id,
      revisionIds: [other.revisions[0]?.id],
    })
    expect(res.status).toBe(422)
  })

  it('does not let clients grant themselves access or read entitlements', async () => {
    const product = await createProductWithRevisions(adminCookie, [])
    expect((await grant({ clientAccountId, productId: product.id }, client.cookie)).status).toBe(
      403,
    )
    const list = await app.request(`/api/client-accounts/${clientAccountId}/entitlements`, {
      headers: { cookie: client.cookie },
    })
    expect(list.status).toBe(403)
  })
})
