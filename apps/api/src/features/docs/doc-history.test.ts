import type { DocPage, DocPageRevision, DocPageRevisionSummary } from '@entitled/contracts/docs'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createProductWithRevisions } from '#test/catalog-fixtures.ts'
import { createClientAccountWith, createSignedInUser, jsonRequest } from '#test/test-users.ts'

describe('doc page history', () => {
  const app = createApp()
  let editor: Awaited<ReturnType<typeof createSignedInUser>>
  let clientCookie: string
  let productId: string

  beforeAll(async () => {
    const adminCookie = (await createSignedInUser({ vendorRole: 'admin' })).cookie
    editor = await createSignedInUser({ vendorRole: 'editor' })
    const client = await createSignedInUser()
    const clientAccountId = await createClientAccountWith(client.id, 'member')
    clientCookie = client.cookie
    productId = (await createProductWithRevisions(adminCookie, [])).id
    await app.request(
      '/api/entitlements',
      jsonRequest('POST', { clientAccountId, productId }, adminCookie),
    )
  })

  const createPage = async (body: string) =>
    (await (
      await app.request(
        `/api/products/${productId}/docs`,
        jsonRequest('POST', { title: 'Wiring', body }, editor.cookie),
      )
    ).json()) as DocPage
  const patch = (pageId: string, input: object) =>
    app.request(`/api/docs/${pageId}`, jsonRequest('PATCH', input, editor.cookie))
  const revisions = async (pageId: string) =>
    (await (
      await app.request(`/api/docs/${pageId}/revisions`, { headers: { cookie: editor.cookie } })
    ).json()) as DocPageRevisionSummary[]

  it('keeps a version for every save that changes the text, newest first', async () => {
    const page = await createPage('First draft')
    await patch(page.id, { body: 'Second draft' })
    await patch(page.id, { status: 'published' })

    const list = await revisions(page.id)
    expect(list).toHaveLength(2)
    expect(list[0]?.createdByName).toBe('Test User')
    const res = await app.request(`/api/docs/${page.id}/revisions/${list[1]?.id ?? ''}`, {
      headers: { cookie: editor.cookie },
    })
    expect(((await res.json()) as DocPageRevision).body).toBe('First draft')
  })

  it('restores an older version as a new one', async () => {
    const page = await createPage('Original')
    await patch(page.id, { title: 'Renamed', body: 'Rewritten' })
    const original = (await revisions(page.id)).at(-1)

    const res = await app.request(
      `/api/docs/${page.id}/revisions/${original?.id ?? ''}/restore`,
      jsonRequest('POST', undefined, editor.cookie),
    )
    expect(res.status).toBe(200)
    const restored = (await res.json()) as DocPage
    expect(restored.title).toBe('Wiring')
    expect(restored.body).toBe('Original')
    expect(await revisions(page.id)).toHaveLength(3)
  })

  it('does not restore a version that belongs to another page', async () => {
    const first = await createPage('One')
    const second = await createPage('Two')
    const [foreign] = await revisions(second.id)
    const res = await app.request(
      `/api/docs/${first.id}/revisions/${foreign?.id ?? ''}/restore`,
      jsonRequest('POST', undefined, editor.cookie),
    )
    expect(res.status).toBe(404)
  })

  it('keeps history and authors away from clients', async () => {
    const page = await createPage('Client facing')
    await patch(page.id, { status: 'published' })
    const history = await app.request(`/api/docs/${page.id}/revisions`, {
      headers: { cookie: clientCookie },
    })
    expect(history.status).toBe(403)

    const read = (await (
      await app.request(`/api/docs/${page.id}`, { headers: { cookie: clientCookie } })
    ).json()) as DocPage
    expect(read.updatedByName).toBeNull()
    const vendorRead = (await (
      await app.request(`/api/docs/${page.id}`, { headers: { cookie: editor.cookie } })
    ).json()) as DocPage
    expect(vendorRead.updatedByName).toBe('Test User')
  })

  it('returns the section headings with the page', async () => {
    const page = await createPage('## Power\n\nText\n\n### Fuses')
    expect(page.headings).toEqual([
      { id: 'power', text: 'Power', depth: 2 },
      { id: 'fuses', text: 'Fuses', depth: 3 },
    ])
  })
})
