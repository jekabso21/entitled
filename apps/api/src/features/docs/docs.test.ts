import type { DocAssetUpload, DocPage, DocPageSummary } from '@entitled/contracts/docs'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createProductWithRevisions } from '#test/catalog-fixtures.ts'
import { createClientAccountWith, createSignedInUser, jsonRequest } from '#test/test-users.ts'

describe('docs', () => {
  const app = createApp()
  let editor: Awaited<ReturnType<typeof createSignedInUser>>
  let client: Awaited<ReturnType<typeof createSignedInUser>>
  let outsider: Awaited<ReturnType<typeof createSignedInUser>>
  let productId: string

  beforeAll(async () => {
    const admin = await createSignedInUser({ vendorRole: 'admin' })
    editor = await createSignedInUser({ vendorRole: 'editor' })
    client = await createSignedInUser()
    const clientAccountId = await createClientAccountWith(client.id, 'member')
    outsider = await createSignedInUser()
    await createClientAccountWith(outsider.id, 'member')
    productId = (await createProductWithRevisions(admin.cookie, [])).id
    await app.request(
      '/api/entitlements',
      jsonRequest('POST', { clientAccountId, productId }, admin.cookie),
    )
  })

  const createPage = async (title: string, body = '') =>
    (await (
      await app.request(
        `/api/products/${productId}/docs`,
        jsonRequest('POST', { title, body }, editor.cookie),
      )
    ).json()) as DocPage
  const listFor = async (cookie: string) =>
    app.request(`/api/products/${productId}/docs`, { headers: { cookie } })

  it('keeps drafts from clients until published, then renders them', async () => {
    const page = await createPage('Flashing guide', '## Steps\n\n1. Plug in USB')
    expect(page.status).toBe('draft')
    let seen = (await (await listFor(client.cookie)).json()) as DocPageSummary[]
    expect(seen.map((item) => item.id)).not.toContain(page.id)

    await app.request(
      `/api/docs/${page.id}`,
      jsonRequest('PATCH', { status: 'published' }, editor.cookie),
    )
    seen = (await (await listFor(client.cookie)).json()) as DocPageSummary[]
    expect(seen.map((item) => item.id)).toContain(page.id)

    const full = (await (
      await app.request(`/api/docs/${page.id}`, { headers: { cookie: client.cookie } })
    ).json()) as DocPage
    expect(full.bodyHtml).toContain('<h2>Steps</h2>')
  })

  it('exports a page as Markdown and imports Markdown as a new draft', async () => {
    const page = await createPage('Export me', '# Export me\n\nBody text')
    const exported = await app.request(`/api/docs/${page.id}/export`, {
      headers: { cookie: editor.cookie },
    })
    expect(exported.headers.get('content-disposition')).toContain('.md')
    const markdown = await exported.text()

    const imported = (await (
      await app.request(
        `/api/products/${productId}/docs/import`,
        jsonRequest('POST', { fileName: 'export-me.md', markdown }, editor.cookie),
      )
    ).json()) as DocPage
    expect(imported).toMatchObject({ title: 'Export me', body: markdown, status: 'draft' })
    expect(imported.slug).toBe(`${page.slug}-2`)
  })

  it('rejects a slug another page of the product already uses', async () => {
    const first = await createPage('Slug one')
    const second = await createPage('Slug two')
    const res = await app.request(
      `/api/docs/${second.id}`,
      jsonRequest('PATCH', { slug: first.slug }, editor.cookie),
    )
    expect(res.status).toBe(409)
  })

  it('hides docs and embedded assets from clients without the product', async () => {
    expect((await listFor(outsider.cookie)).status).toBe(404)

    const bytes = new TextEncoder().encode('PNG')
    const started = await app.request(
      `/api/products/${productId}/doc-assets`,
      jsonRequest(
        'POST',
        { fileName: 'wiring.png', contentType: 'image/png', sizeBytes: bytes.byteLength },
        editor.cookie,
      ),
    )
    const asset = (await started.json()) as DocAssetUpload
    await fetch(asset.uploadUrl, { method: 'PUT', headers: asset.uploadHeaders, body: bytes })

    expect((await app.request(asset.url, { headers: { cookie: client.cookie } })).status).toBe(302)
    expect((await app.request(asset.url, { headers: { cookie: outsider.cookie } })).status).toBe(
      404,
    )
  })

  it('does not let clients edit docs', async () => {
    const page = await createPage('Read only')
    const res = await app.request(
      `/api/docs/${page.id}`,
      jsonRequest('PATCH', { title: 'Hacked' }, client.cookie),
    )
    expect(res.status).toBe(403)
  })
})
