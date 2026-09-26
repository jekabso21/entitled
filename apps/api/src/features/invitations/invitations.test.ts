import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { findInvitationToken, findQueuedEmails } from '#test/sent-emails.ts'
import {
  createClientAccountWith,
  createSignedInUser,
  jsonRequest,
  TEST_ORIGIN,
  uniqueSuffix,
} from '#test/test-users.ts'

describe('invitations', () => {
  const app = createApp()
  let vendorAdmin: Awaited<ReturnType<typeof createSignedInUser>>
  let clientAdmin: Awaited<ReturnType<typeof createSignedInUser>>
  let clientAccountId: string

  beforeAll(async () => {
    vendorAdmin = await createSignedInUser({ vendorRole: 'admin' })
    clientAdmin = await createSignedInUser()
    clientAccountId = await createClientAccountWith(clientAdmin.id, 'admin')
  })

  const inviteClient = (email: string, cookie: string, accountId = clientAccountId) =>
    app.request(
      '/api/invitations',
      jsonRequest(
        'POST',
        { kind: 'client', email, clientAccountId: accountId, clientRole: 'member' },
        cookie,
      ),
    )

  it('emails an invitation link that a new user accepts to get an account and session', async () => {
    const email = `new-${uniqueSuffix()}@example.test`
    expect((await inviteClient(email, vendorAdmin.cookie)).status).toBe(201)

    const [queued] = await findQueuedEmails(email)
    expect(queued?.subject).toContain('invited')
    const token = await findInvitationToken(email)

    const preview = await app.request(`/api/invitations/${token}`)
    expect(await preview.json()).toMatchObject({ email, kind: 'client' })

    const accepted = await app.request(
      `/api/invitations/${token}/accept`,
      jsonRequest('POST', { name: 'New Person', password: 'a-long-enough-password' }),
    )
    expect(accepted.status).toBe(200)
    const cookie = accepted.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ')

    const me = await app.request('/api/me', { headers: { cookie, origin: TEST_ORIGIN } })
    expect(await me.json()).toMatchObject({
      email,
      vendorRole: null,
      memberships: [{ clientAccountId, role: 'member' }],
    })
  })

  it('cannot be accepted twice', async () => {
    const email = `twice-${uniqueSuffix()}@example.test`
    await inviteClient(email, vendorAdmin.cookie)
    const token = await findInvitationToken(email)
    const body = { name: 'Twice', password: 'a-long-enough-password' }

    await app.request(`/api/invitations/${token}/accept`, jsonRequest('POST', body))
    const again = await app.request(`/api/invitations/${token}/accept`, jsonRequest('POST', body))
    expect(again.status).toBe(404)
  })

  it('lets a client admin invite into their own account only', async () => {
    const own = await inviteClient(`colleague-${uniqueSuffix()}@example.test`, clientAdmin.cookie)
    expect(own.status).toBe(201)

    const otherOwner = await createSignedInUser()
    const otherAccountId = await createClientAccountWith(otherOwner.id, 'admin')
    const foreign = await inviteClient(
      `intruder-${uniqueSuffix()}@example.test`,
      clientAdmin.cookie,
      otherAccountId,
    )
    expect(foreign.status).toBe(403)
  })

  it('does not let client members or client admins invite vendor staff', async () => {
    const member = await createSignedInUser()
    await createClientAccountWith(member.id, 'member')
    const memberInvite = await inviteClient(`m-${uniqueSuffix()}@example.test`, member.cookie)
    expect(memberInvite.status).toBe(403)

    const vendorInvite = await app.request(
      '/api/invitations',
      jsonRequest(
        'POST',
        { kind: 'vendor', email: `staff-${uniqueSuffix()}@example.test`, vendorRole: 'admin' },
        clientAdmin.cookie,
      ),
    )
    expect(vendorInvite.status).toBe(403)
  })

  it('requires an existing user to sign in before accepting', async () => {
    const existing = await createSignedInUser()
    await inviteClient(existing.email, vendorAdmin.cookie)
    const token = await findInvitationToken(existing.email)

    const anonymous = await app.request(`/api/invitations/${token}/accept`, jsonRequest('POST', {}))
    expect(anonymous.status).toBe(403)

    const signedIn = await app.request(
      `/api/invitations/${token}/accept`,
      jsonRequest('POST', {}, existing.cookie),
    )
    expect(signedIn.status).toBe(200)
  })

  it('makes vendor staff out of an accepted vendor invitation', async () => {
    const email = `staff-${uniqueSuffix()}@example.test`
    await app.request(
      '/api/invitations',
      jsonRequest('POST', { kind: 'vendor', email, vendorRole: 'editor' }, vendorAdmin.cookie),
    )
    const token = await findInvitationToken(email)
    const accepted = await app.request(
      `/api/invitations/${token}/accept`,
      jsonRequest('POST', { name: 'Staff', password: 'a-long-enough-password' }),
    )
    const cookie = accepted.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ')
    const me = await app.request('/api/me', { headers: { cookie } })
    expect(await me.json()).toMatchObject({ vendorRole: 'editor', memberships: [] })
  })
})
