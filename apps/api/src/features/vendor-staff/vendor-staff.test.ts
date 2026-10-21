import type { VendorStaffMember } from '@entitled/contracts/accounts'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createSignedInUser, jsonRequest } from '#test/test-users.ts'

describe('vendor staff', () => {
  const app = createApp()
  let admin: Awaited<ReturnType<typeof createSignedInUser>>

  beforeAll(async () => {
    admin = await createSignedInUser({ vendorRole: 'admin' })
  })

  const update = (userId: string, vendorRole: string | null, cookie = admin.cookie) =>
    app.request(`/api/vendor-staff/${userId}`, jsonRequest('PATCH', { vendorRole }, cookie))

  it('lists staff and changes roles', async () => {
    const editor = await createSignedInUser({ vendorRole: 'editor' })
    expect((await update(editor.id, 'support')).status).toBe(204)

    const staff = (await (
      await app.request('/api/vendor-staff', { headers: { cookie: admin.cookie } })
    ).json()) as VendorStaffMember[]
    expect(staff.find((member) => member.userId === editor.id)?.vendorRole).toBe('support')
  })

  it('removing vendor access signs the person out immediately', async () => {
    const leaver = await createSignedInUser({ vendorRole: 'editor' })
    expect((await app.request('/api/me', { headers: { cookie: leaver.cookie } })).status).toBe(200)

    expect((await update(leaver.id, null)).status).toBe(204)
    expect((await app.request('/api/me', { headers: { cookie: leaver.cookie } })).status).toBe(401)
  })

  it('refuses to change your own access', async () => {
    expect((await update(admin.id, 'editor')).status).toBe(422)
  })

  it('is managed by vendor admins only', async () => {
    const support = await createSignedInUser({ vendorRole: 'support' })
    const target = await createSignedInUser({ vendorRole: 'editor' })
    expect((await update(target.id, null, support.cookie)).status).toBe(403)
  })
})
