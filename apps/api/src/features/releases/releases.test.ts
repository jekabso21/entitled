import type { Release } from '@entitled/contracts/releases'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createProductWithRevisions } from '#test/catalog-fixtures.ts'
import { changeStatus, createReleaseFor } from '#test/release-fixtures.ts'
import { createClientAccountWith, createSignedInUser, jsonRequest } from '#test/test-users.ts'

describe('releases', () => {
  const app = createApp()
  let adminCookie: string
  let client: Awaited<ReturnType<typeof createSignedInUser>>
  let clientAccountId: string

  beforeAll(async () => {
    adminCookie = (await createSignedInUser({ vendorRole: 'admin' })).cookie
    client = await createSignedInUser()
    clientAccountId = await createClientAccountWith(client.id, 'member')
  })

  async function entitledProduct(codes: string[], grantedCodes: string[] = []) {
    const product = await createProductWithRevisions(adminCookie, codes)
    const revisionIds = product.revisions
      .filter((revision) => grantedCodes.includes(revision.code))
      .map((revision) => revision.id)
    await app.request(
      '/api/entitlements',
      jsonRequest('POST', { clientAccountId, productId: product.id, revisionIds }, adminCookie),
    )
    return product
  }

  const clientReleases = async (productId: string) =>
    (await (
      await app.request(`/api/products/${productId}/releases`, {
        headers: { cookie: client.cookie },
      })
    ).json()) as Release[]

  it('keeps new releases as drafts hidden from clients until published', async () => {
    const product = await entitledProduct(['A'])
    const release = await createReleaseFor(adminCookie, product.id)
    expect(release.status).toBe('draft')
    expect(await clientReleases(product.id)).toEqual([])

    expect((await changeStatus(adminCookie, release.id, 'publish')).status).toBe(200)
    expect((await clientReleases(product.id)).map((item) => item.id)).toEqual([release.id])

    expect((await changeStatus(adminCookie, release.id, 'archive')).status).toBe(200)
    expect(await clientReleases(product.id)).toEqual([])
  })

  it('publishes straight away when auto-publish is enabled', async () => {
    const product = await entitledProduct([])
    await app.request(
      '/api/settings',
      jsonRequest('PATCH', { autoPublishReleases: true }, adminCookie),
    )
    try {
      const release = await createReleaseFor(adminCookie, product.id)
      expect(release.status).toBe('published')
      expect(release.publishedAt).not.toBeNull()
    } finally {
      await app.request(
        '/api/settings',
        jsonRequest('PATCH', { autoPublishReleases: false }, adminCookie),
      )
    }
  })

  it('shows a ranged release only to clients entitled to a revision inside the range', async () => {
    const product = await entitledProduct(['A', 'B', 'C'], ['A'])
    const revisionB = product.revisions.find((revision) => revision.code === 'B')
    const ranged = await createReleaseFor(adminCookie, product.id, { minRevisionId: revisionB?.id })
    const open = await createReleaseFor(adminCookie, product.id)
    await changeStatus(adminCookie, ranged.id, 'publish')
    await changeStatus(adminCookie, open.id, 'publish')

    expect((await clientReleases(product.id)).map((item) => item.id)).toEqual([open.id])
    const direct = await app.request(`/api/releases/${ranged.id}`, {
      headers: { cookie: client.cookie },
    })
    expect(direct.status).toBe(404)
  })

  it('rejects a revision range that runs backwards', async () => {
    const product = await entitledProduct(['A', 'B'])
    const [revisionA, revisionB] = product.revisions
    const res = await app.request(
      '/api/releases',
      jsonRequest(
        'POST',
        {
          productId: product.id,
          version: '9.9.9',
          minRevisionId: revisionB?.id,
          maxRevisionId: revisionA?.id,
        },
        adminCookie,
      ),
    )
    expect(res.status).toBe(422)
  })

  it('freezes version and range after publishing but allows changelog fixes', async () => {
    const product = await entitledProduct([])
    const release = await createReleaseFor(adminCookie, product.id)
    await changeStatus(adminCookie, release.id, 'publish')

    const renamed = await app.request(
      `/api/releases/${release.id}`,
      jsonRequest('PATCH', { version: '2.0.0' }, adminCookie),
    )
    expect(renamed.status).toBe(422)
    const fixed = await app.request(
      `/api/releases/${release.id}`,
      jsonRequest('PATCH', { changelog: '- Fixed a typo' }, adminCookie),
    )
    expect(((await fixed.json()) as Release).changelog).toBe('- Fixed a typo')
  })

  it('shows a release for selected accounts only to those accounts, even after publishing', async () => {
    const product = await entitledProduct([])
    const other = await createSignedInUser()
    const otherAccountId = await createClientAccountWith(other.id, 'member')
    await app.request(
      '/api/entitlements',
      jsonRequest(
        'POST',
        { clientAccountId: otherAccountId, productId: product.id, revisionIds: [] },
        adminCookie,
      ),
    )
    const release = await createReleaseFor(adminCookie, product.id)
    await changeStatus(adminCookie, release.id, 'publish')

    const restricted = await app.request(
      `/api/releases/${release.id}`,
      jsonRequest(
        'PATCH',
        { audience: 'selected', clientAccountIds: [clientAccountId] },
        adminCookie,
      ),
    )
    expect(restricted.status).toBe(200)
    expect((await restricted.json()) as Release).toMatchObject({
      audience: 'selected',
      clientAccountIds: [clientAccountId],
    })

    const seen = await clientReleases(product.id)
    expect(seen.map((item) => item.id)).toEqual([release.id])
    expect(seen[0]?.clientAccountIds).toEqual([])
    const otherList = await app.request(`/api/products/${product.id}/releases`, {
      headers: { cookie: other.cookie },
    })
    expect(await otherList.json()).toEqual([])
    const otherDirect = await app.request(`/api/releases/${release.id}`, {
      headers: { cookie: other.cookie },
    })
    expect(otherDirect.status).toBe(404)
  })

  it('rejects an unknown client account in the release audience', async () => {
    const product = await entitledProduct([])
    const release = await createReleaseFor(adminCookie, product.id)
    const res = await app.request(
      `/api/releases/${release.id}`,
      jsonRequest(
        'PATCH',
        { audience: 'selected', clientAccountIds: [crypto.randomUUID()] },
        adminCookie,
      ),
    )
    expect(res.status).toBe(404)
  })

  it('rejects a duplicate version for the same product', async () => {
    const product = await entitledProduct([])
    await createReleaseFor(adminCookie, product.id, { version: '1.0.0' })
    const again = await app.request(
      '/api/releases',
      jsonRequest('POST', { productId: product.id, version: '1.0.0' }, adminCookie),
    )
    expect(again.status).toBe(409)
  })

  it('does not let clients create releases', async () => {
    const product = await entitledProduct([])
    const res = await app.request(
      '/api/releases',
      jsonRequest('POST', { productId: product.id, version: '1.0.0' }, client.cookie),
    )
    expect(res.status).toBe(403)
  })
})
