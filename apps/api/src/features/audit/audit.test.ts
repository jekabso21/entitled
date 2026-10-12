import type { AuditPage } from '@entitled/contracts/audit'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createSignedInUser, jsonRequest, uniqueSuffix } from '#test/test-users.ts'

describe('audit log', () => {
  const app = createApp()
  let admin: Awaited<ReturnType<typeof createSignedInUser>>

  beforeAll(async () => {
    admin = await createSignedInUser({ vendorRole: 'admin' })
  })

  it('records admin actions with the actor and pages through them', async () => {
    for (let index = 0; index < 3; index += 1) {
      await app.request(
        '/api/client-accounts',
        jsonRequest('POST', { name: 'Audited', slug: `audited-${uniqueSuffix()}` }, admin.cookie),
      )
    }
    const first = (await (
      await app.request('/api/audit-log?limit=2&action=client_account', {
        headers: { cookie: admin.cookie },
      })
    ).json()) as AuditPage
    expect(first.entries).toHaveLength(2)
    expect(first.entries[0]).toMatchObject({
      action: 'client_account.created',
      actorEmail: admin.email,
    })
    expect(first.nextCursor).not.toBeNull()

    const second = (await (
      await app.request(
        `/api/audit-log?limit=2&action=client_account&cursor=${first.nextCursor ?? ''}`,
        {
          headers: { cookie: admin.cookie },
        },
      )
    ).json()) as AuditPage
    const ids = new Set([...first.entries, ...second.entries].map((entry) => entry.id))
    expect(ids.size).toBe(first.entries.length + second.entries.length)
  })

  it('is visible to vendor admins only', async () => {
    const editor = await createSignedInUser({ vendorRole: 'editor' })
    const res = await app.request('/api/audit-log', { headers: { cookie: editor.cookie } })
    expect(res.status).toBe(403)
  })
})
