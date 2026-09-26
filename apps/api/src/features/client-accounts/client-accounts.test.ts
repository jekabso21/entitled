import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createSignedInUser, jsonRequest, uniqueSuffix } from '#test/test-users.ts'

describe('client accounts', () => {
  const app = createApp()
  let adminCookie: string
  let supportCookie: string
  let clientCookie: string

  beforeAll(async () => {
    adminCookie = (await createSignedInUser({ vendorRole: 'admin' })).cookie
    supportCookie = (await createSignedInUser({ vendorRole: 'support' })).cookie
    clientCookie = (await createSignedInUser()).cookie
  })

  it('lets a vendor admin create a client account and lists it with its member count', async () => {
    const slug = `acme-${uniqueSuffix()}`
    const created = await app.request(
      '/api/client-accounts',
      jsonRequest('POST', { name: 'Acme', slug }, adminCookie),
    )
    expect(created.status).toBe(201)

    const list = await app.request('/api/client-accounts', { headers: { cookie: supportCookie } })
    const accounts = (await list.json()) as { slug: string; memberCount: number }[]
    expect(accounts.find((account) => account.slug === slug)).toMatchObject({ memberCount: 0 })
  })

  it('rejects a duplicate slug with 409', async () => {
    const body = { name: 'Dup', slug: `dup-${uniqueSuffix()}` }
    await app.request('/api/client-accounts', jsonRequest('POST', body, adminCookie))
    const again = await app.request('/api/client-accounts', jsonRequest('POST', body, adminCookie))
    expect(again.status).toBe(409)
  })

  it('forbids vendor support from creating accounts', async () => {
    const res = await app.request(
      '/api/client-accounts',
      jsonRequest('POST', { name: 'X', slug: `x-${uniqueSuffix()}` }, supportCookie),
    )
    expect(res.status).toBe(403)
  })

  it('hides the client account list from client users and anonymous callers', async () => {
    const asClient = await app.request('/api/client-accounts', {
      headers: { cookie: clientCookie },
    })
    const anonymous = await app.request('/api/client-accounts')
    expect(asClient.status).toBe(403)
    expect(anonymous.status).toBe(401)
  })

  it('returns 422 with details for an invalid slug', async () => {
    const res = await app.request(
      '/api/client-accounts',
      jsonRequest('POST', { name: 'Bad', slug: 'Not A Slug' }, adminCookie),
    )
    expect(res.status).toBe(422)
    expect(await res.json()).toMatchObject({ error: { code: 'validation_failed' } })
  })
})
