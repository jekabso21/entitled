import type { DocPage, DocPageSummary } from '@entitled/contracts/docs'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createProductWithRevisions } from '#test/catalog-fixtures.ts'
import { createClientAccountWith, createSignedInUser, jsonRequest } from '#test/test-users.ts'

describe('doc page tree', () => {
  const app = createApp()
  let adminCookie: string
  let editorCookie: string
  let client: Awaited<ReturnType<typeof createSignedInUser>>
  let clientAccountId: string

  beforeAll(async () => {
    adminCookie = (await createSignedInUser({ vendorRole: 'admin' })).cookie
    editorCookie = (await createSignedInUser({ vendorRole: 'editor' })).cookie
    client = await createSignedInUser()
    clientAccountId = await createClientAccountWith(client.id, 'member')
  })

  async function entitledProduct() {
    const product = await createProductWithRevisions(adminCookie, [])
    await app.request(
      '/api/entitlements',
      jsonRequest('POST', { clientAccountId, productId: product.id }, adminCookie),
    )
    return product.id
  }

  const importPages = (productId: string, body: object) =>
    app.request(`/api/products/${productId}/docs/import-pages`, {
      ...jsonRequest('POST', body, editorCookie),
    })
  const list = async (productId: string, cookie: string) =>
    (await (
      await app.request(`/api/products/${productId}/docs`, { headers: { cookie } })
    ).json()) as DocPageSummary[]

  it('imports a nested tree of pages in reading order', async () => {
    const productId = await entitledProduct()
    const res = await importPages(productId, {
      pages: [
        { title: 'Getting started', body: 'Intro', depth: 0 },
        { title: 'Unboxing', body: 'Open the box', depth: 1 },
        { title: 'Wiring', body: 'Connect', depth: 1 },
        { title: 'Reference', body: '', depth: 0 },
      ],
    })
    expect(res.status).toBe(201)
    const created = (await res.json()) as DocPageSummary[]
    const byTitle = new Map(created.map((page) => [page.title, page]))
    expect(byTitle.get('Unboxing')?.parentId).toBe(byTitle.get('Getting started')?.id)
    expect(byTitle.get('Wiring')?.parentId).toBe(byTitle.get('Getting started')?.id)
    expect(byTitle.get('Reference')?.parentId).toBeNull()
    expect(created.every((page) => page.status === 'draft')).toBe(true)
  })

  it('rejects imports that skip a level or nest too deep', async () => {
    const productId = await entitledProduct()
    const skipping = await importPages(productId, {
      pages: [
        { title: 'A', body: '', depth: 0 },
        { title: 'B', body: '', depth: 2 },
      ],
    })
    expect(skipping.status).toBe(422)

    const [deepest] = (await (
      await importPages(productId, {
        pages: [
          { title: 'L1', body: '', depth: 0 },
          { title: 'L2', body: '', depth: 1 },
          { title: 'L3', body: '', depth: 2 },
        ],
      })
    ).json()) as DocPageSummary[]
    const l3 = (await list(productId, editorCookie)).find((page) => page.title === 'L3')
    expect(deepest).toBeDefined()
    const tooDeep = await importPages(productId, {
      parentId: l3?.id,
      pages: [{ title: 'L4', body: '', depth: 0 }],
    })
    expect(tooDeep.status).toBe(422)
  })

  it('hides published pages from clients while a page above them is a draft', async () => {
    const productId = await entitledProduct()
    await importPages(productId, {
      status: 'published',
      pages: [
        { title: 'Section', body: '', depth: 0 },
        { title: 'Inside', body: 'Secret until the section ships', depth: 1 },
      ],
    })
    const pages = await list(productId, editorCookie)
    const section = pages.find((page) => page.title === 'Section')
    const inside = pages.find((page) => page.title === 'Inside')
    expect((await list(productId, client.cookie)).map((page) => page.title)).toEqual([
      'Section',
      'Inside',
    ])

    await app.request(
      `/api/docs/${section?.id ?? ''}`,
      jsonRequest('PATCH', { status: 'draft' }, editorCookie),
    )
    expect(await list(productId, client.cookie)).toEqual([])
    const direct = await app.request(`/api/docs/${inside?.id ?? ''}`, {
      headers: { cookie: client.cookie },
    })
    expect(direct.status).toBe(404)
  })

  it('moves and reorders pages, and rejects loops', async () => {
    const productId = await entitledProduct()
    const created = (await (
      await importPages(productId, {
        pages: [
          { title: 'One', body: '', depth: 0 },
          { title: 'Two', body: '', depth: 0 },
          { title: 'Three', body: '', depth: 0 },
        ],
      })
    ).json()) as DocPageSummary[]
    const [one, two, three] = created.map((page) => page.id)
    const order = (pages: { id: string | undefined; parentId: string | null | undefined }[]) =>
      app.request(
        `/api/products/${productId}/docs/order`,
        jsonRequest('PUT', { pages }, editorCookie),
      )

    const moved = await order([
      { id: three, parentId: null },
      { id: one, parentId: null },
      { id: two, parentId: one },
    ])
    expect(moved.status).toBe(204)
    const pages = await list(productId, editorCookie)
    expect(pages.filter((page) => page.parentId === null).map((page) => page.title)).toEqual([
      'Three',
      'One',
    ])
    expect(pages.find((page) => page.title === 'Two')?.parentId).toBe(one)

    const loop = await order([
      { id: one, parentId: two },
      { id: two, parentId: one },
      { id: three, parentId: null },
    ])
    expect(loop.status).toBe(422)
    const partial = await order([{ id: one, parentId: null }])
    expect(partial.status).toBe(409)
  })

  it('creates a sub-page and deletes it together with its parent', async () => {
    const productId = await entitledProduct()
    const create = async (body: object) =>
      (await (
        await app.request(
          `/api/products/${productId}/docs`,
          jsonRequest('POST', body, editorCookie),
        )
      ).json()) as DocPage
    const parent = await create({ title: 'Parent' })
    const child = await create({ title: 'Child', parentId: parent.id })
    expect(child.parentId).toBe(parent.id)

    await app.request(`/api/docs/${parent.id}`, {
      method: 'DELETE',
      headers: { cookie: editorCookie },
    })
    expect(await list(productId, editorCookie)).toEqual([])
  })

  it('does not let clients import or reorder pages', async () => {
    const productId = await entitledProduct()
    const res = await app.request(
      `/api/products/${productId}/docs/import-pages`,
      jsonRequest('POST', { pages: [{ title: 'X', body: '', depth: 0 }] }, client.cookie),
    )
    expect(res.status).toBe(403)
  })
})
