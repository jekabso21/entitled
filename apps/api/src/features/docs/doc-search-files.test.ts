import type { DocAsset, DocAssetUpload, DocPage, DocSearchResult } from '@entitled/contracts/docs'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createProductWithRevisions } from '#test/catalog-fixtures.ts'
import { createClientAccountWith, createSignedInUser, jsonRequest } from '#test/test-users.ts'

describe('doc search and files', () => {
  const app = createApp()
  let adminCookie: string
  let editorCookie: string
  let clientCookie: string
  let clientAccountId: string

  beforeAll(async () => {
    adminCookie = (await createSignedInUser({ vendorRole: 'admin' })).cookie
    editorCookie = (await createSignedInUser({ vendorRole: 'editor' })).cookie
    const client = await createSignedInUser()
    clientCookie = client.cookie
    clientAccountId = await createClientAccountWith(client.id, 'member')
  })

  async function product({ entitled }: { entitled: boolean }) {
    const created = await createProductWithRevisions(adminCookie, [])
    if (entitled) {
      await app.request(
        '/api/entitlements',
        jsonRequest('POST', { clientAccountId, productId: created.id }, adminCookie),
      )
    }
    return created.id
  }

  async function page(productId: string, title: string, body: string, isPublished = true) {
    const created = (await (
      await app.request(
        `/api/products/${productId}/docs`,
        jsonRequest('POST', { title, body }, editorCookie),
      )
    ).json()) as DocPage
    if (isPublished) {
      await app.request(
        `/api/docs/${created.id}`,
        jsonRequest('PATCH', { status: 'published' }, editorCookie),
      )
    }
    return created
  }

  const search = (productId: string, q: string, cookie: string) =>
    app.request(`/api/products/${productId}/docs/search?q=${encodeURIComponent(q)}`, {
      headers: { cookie },
    })

  it('finds published pages by words and word beginnings, title matches first', async () => {
    const productId = await product({ entitled: true })
    await page(productId, 'Flashing firmware', 'Use the USB cable.')
    await page(productId, 'Wiring', 'Before flashing, check the fuse.')
    const res = await search(productId, 'flash', clientCookie)
    expect(res.status).toBe(200)
    const results = (await res.json()) as DocSearchResult[]
    expect(results.map((result) => result.title)).toEqual(['Flashing firmware', 'Wiring'])
    expect(results[1]?.snippet).toContain('⟦flashing⟧')
  })

  it('hides draft pages and pages under a draft parent from clients', async () => {
    const productId = await product({ entitled: true })
    await page(productId, 'Secret calibration', 'Factory only', false)
    const results = (await (await search(productId, 'calibration', clientCookie)).json()) as []
    expect(results).toHaveLength(0)
    const vendor = (await (await search(productId, 'calibration', editorCookie)).json()) as []
    expect(vendor).toHaveLength(1)
  })

  it('does not search products the client is not entitled to', async () => {
    const productId = await product({ entitled: false })
    await page(productId, 'Other vendor product', 'Hidden')
    expect((await search(productId, 'hidden', clientCookie)).status).toBe(404)
  })

  it('treats search syntax as plain words', async () => {
    const productId = await product({ entitled: true })
    const res = await search(productId, "fuse' & !:* ||", clientCookie)
    expect(res.status).toBe(200)
  })

  it('lists files with the pages using them and deletes only unused ones', async () => {
    const productId = await product({ entitled: true })
    const upload = async (fileName: string) =>
      (await (
        await app.request(
          `/api/products/${productId}/doc-assets`,
          jsonRequest('POST', { fileName, contentType: 'image/png', sizeBytes: 10 }, editorCookie),
        )
      ).json()) as DocAssetUpload
    const used = await upload('pinout.png')
    const spare = await upload('old.png')
    await page(productId, 'Pinout', `![Pinout](${used.url})`)

    const files = (await (
      await app.request(`/api/products/${productId}/doc-assets`, {
        headers: { cookie: editorCookie },
      })
    ).json()) as DocAsset[]
    expect(files.find((file) => file.id === used.assetId)?.usedBy.map((p) => p.title)).toEqual([
      'Pinout',
    ])
    expect(files.find((file) => file.id === spare.assetId)?.usedBy).toEqual([])

    const remove = (assetIds: string[] | null) =>
      app.request(
        `/api/products/${productId}/doc-assets/delete`,
        jsonRequest('POST', { assetIds }, editorCookie),
      )
    expect((await remove([used.assetId])).status).toBe(409)
    expect(await (await remove(null)).json()).toEqual({ deleted: 1 })
  })

  it('keeps the file list away from clients', async () => {
    const productId = await product({ entitled: true })
    const res = await app.request(`/api/products/${productId}/doc-assets`, {
      headers: { cookie: clientCookie },
    })
    expect(res.status).toBe(403)
  })
})
