import type { Branding } from '@entitled/contracts/settings'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createSignedInUser, jsonRequest } from '#test/test-users.ts'

// A 1x1 transparent PNG.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

describe('branding', () => {
  const app = createApp()
  let adminCookie: string

  beforeAll(async () => {
    adminCookie = (await createSignedInUser({ vendorRole: 'admin' })).cookie
  })

  it('is readable without signing in, for the sign-in page', async () => {
    const res = await app.request('/api/branding')
    expect(res.status).toBe(200)
    expect(await res.json()).toHaveProperty('portalName')
  })

  it('lets a vendor admin rename the portal and change its colour', async () => {
    const res = await app.request(
      '/api/branding',
      jsonRequest('PATCH', { portalName: 'Acme Support', primaryColor: 'emerald' }, adminCookie),
    )
    expect(await res.json()).toMatchObject({ portalName: 'Acme Support', primaryColor: 'emerald' })
  })

  it('stores a PNG logo and serves it with locked-down headers', async () => {
    const uploaded = await app.request('/api/branding/logo', {
      method: 'PUT',
      headers: {
        cookie: adminCookie,
        'content-type': 'image/png',
        origin: 'http://localhost:3000',
      },
      body: png,
    })
    const branding = (await uploaded.json()) as Branding
    expect(branding.logoUrl).toMatch(/^\/api\/branding\/logo\?v=\d+$/)

    const served = await app.request(branding.logoUrl ?? '')
    expect(served.headers.get('content-type')).toBe('image/png')
    expect(served.headers.get('content-security-policy')).toBe("default-src 'none'")
    expect(Buffer.from(await served.arrayBuffer())).toEqual(png)
  })

  it('rejects SVG logos, which could carry scripts', async () => {
    const res = await app.request('/api/branding/logo', {
      method: 'PUT',
      headers: {
        cookie: adminCookie,
        'content-type': 'image/svg+xml',
        origin: 'http://localhost:3000',
      },
      body: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    })
    expect(res.status).toBe(422)
  })

  it('does not let editors change branding', async () => {
    const editor = await createSignedInUser({ vendorRole: 'editor' })
    const res = await app.request(
      '/api/branding',
      jsonRequest('PATCH', { portalName: 'Nope' }, editor.cookie),
    )
    expect(res.status).toBe(403)
  })
})
