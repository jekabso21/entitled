import type { ClientAccountDetail } from '@entitled/contracts/client-accounts'
import type { Invitation } from '@entitled/contracts/invitations'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { findInvitationToken } from '#test/sent-emails.ts'
import {
  createClientAccountWith,
  createSignedInUser,
  jsonRequest,
  uniqueSuffix,
} from '#test/test-users.ts'
import { db } from '#lib/db.ts'
import { members } from '@entitled/db/schema'

describe('client account members', () => {
  const app = createApp()
  let vendorAdminCookie: string
  let clientAdmin: Awaited<ReturnType<typeof createSignedInUser>>
  let colleague: Awaited<ReturnType<typeof createSignedInUser>>
  let accountId: string

  beforeAll(async () => {
    vendorAdminCookie = (await createSignedInUser({ vendorRole: 'admin' })).cookie
    clientAdmin = await createSignedInUser()
    colleague = await createSignedInUser()
    accountId = await createClientAccountWith(clientAdmin.id, 'admin')
    await db
      .insert(members)
      .values({
        organizationId: accountId,
        userId: colleague.id,
        role: 'member',
        createdAt: new Date(),
      })
  })

  const memberUrl = (userId: string, id = accountId) =>
    `/api/client-accounts/${id}/members/${userId}`

  it('lets a client admin see and promote colleagues in their own account', async () => {
    const detail = await app.request(`/api/client-accounts/${accountId}`, {
      headers: { cookie: clientAdmin.cookie },
    })
    expect(((await detail.json()) as ClientAccountDetail).members).toHaveLength(2)

    const promoted = await app.request(
      memberUrl(colleague.id),
      jsonRequest('PATCH', { role: 'admin' }, clientAdmin.cookie),
    )
    const roles = ((await promoted.json()) as ClientAccountDetail).members.map(
      (member) => member.role,
    )
    expect(roles).toEqual(['admin', 'admin'])
    await app.request(
      memberUrl(colleague.id),
      jsonRequest('PATCH', { role: 'member' }, clientAdmin.cookie),
    )
  })

  it('keeps at least one client admin', async () => {
    const res = await app.request(
      memberUrl(clientAdmin.id),
      jsonRequest('PATCH', { role: 'member' }, clientAdmin.cookie),
    )
    expect(res.status).toBe(422)
  })

  it('does not let members or other accounts manage the team', async () => {
    const asMember = await app.request(memberUrl(clientAdmin.id), {
      method: 'DELETE',
      headers: { cookie: colleague.cookie },
    })
    expect(asMember.status).toBe(403)

    const other = await createSignedInUser()
    await createClientAccountWith(other.id, 'admin')
    const asOtherAdmin = await app.request(memberUrl(colleague.id), {
      method: 'DELETE',
      headers: { cookie: other.cookie },
    })
    expect(asOtherAdmin.status).toBe(403)
  })

  it('lets a vendor admin remove a member', async () => {
    const extra = await createSignedInUser()
    await db
      .insert(members)
      .values({
        organizationId: accountId,
        userId: extra.id,
        role: 'member',
        createdAt: new Date(),
      })
    const res = await app.request(memberUrl(extra.id), {
      method: 'DELETE',
      headers: { cookie: vendorAdminCookie },
    })
    const ids = ((await res.json()) as ClientAccountDetail).members.map((member) => member.userId)
    expect(ids).not.toContain(extra.id)
  })

  it('revokes pending invitations so their links stop working', async () => {
    const email = `revoked-${uniqueSuffix()}@example.test`
    const invited = (await (
      await app.request(
        '/api/invitations',
        jsonRequest(
          'POST',
          { kind: 'client', email, clientAccountId: accountId, clientRole: 'member' },
          clientAdmin.cookie,
        ),
      )
    ).json()) as Invitation
    const token = await findInvitationToken(email)

    const revoked = await app.request(`/api/invitations/${invited.id}`, {
      method: 'DELETE',
      headers: { cookie: clientAdmin.cookie },
    })
    expect(revoked.status).toBe(204)
    expect((await app.request(`/api/invitations/${token}`)).status).toBe(404)

    const again = await app.request(`/api/invitations/${invited.id}`, {
      method: 'DELETE',
      headers: { cookie: clientAdmin.cookie },
    })
    expect(again.status).toBe(422)
  })
})
