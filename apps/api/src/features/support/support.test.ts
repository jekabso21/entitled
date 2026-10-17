import type {
  SupportAttachmentUpload,
  SupportThread,
  SupportThreadSummary,
} from '@entitled/contracts/support'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { createProductWithRevisions } from '#test/catalog-fixtures.ts'
import { findQueuedEmails } from '#test/sent-emails.ts'
import { createClientAccountWith, createSignedInUser, jsonRequest } from '#test/test-users.ts'

describe('support threads', () => {
  const app = createApp()
  let admin: Awaited<ReturnType<typeof createSignedInUser>>
  let supportAgent: Awaited<ReturnType<typeof createSignedInUser>>
  let client: Awaited<ReturnType<typeof createSignedInUser>>
  let outsider: Awaited<ReturnType<typeof createSignedInUser>>
  let productId: string

  beforeAll(async () => {
    admin = await createSignedInUser({ vendorRole: 'admin' })
    supportAgent = await createSignedInUser({ vendorRole: 'support' })
    client = await createSignedInUser()
    const clientAccountId = await createClientAccountWith(client.id, 'member')
    outsider = await createSignedInUser()
    await createClientAccountWith(outsider.id, 'admin')
    productId = (await createProductWithRevisions(admin.cookie, ['A'])).id
    await app.request(
      '/api/entitlements',
      jsonRequest('POST', { clientAccountId, productId }, admin.cookie),
    )
  })

  async function openThread(body = 'The unit reboots after flashing.') {
    const res = await app.request(
      '/api/support/threads',
      jsonRequest('POST', { productId, subject: 'Boot loop on rev A', body }, client.cookie),
    )
    expect(res.status).toBe(201)
    return (await res.json()) as SupportThread
  }

  const getThread = (id: string, cookie: string) =>
    app.request(`/api/support/threads/${id}`, { headers: { cookie } })
  const reply = (id: string, body: object, cookie: string) =>
    app.request(`/api/support/threads/${id}/messages`, jsonRequest('POST', body, cookie))

  it('lets a client open a request that vendor support sees and is emailed about', async () => {
    const thread = await openThread()
    expect(thread).toMatchObject({ status: 'open', productId })

    const inbox = (await (
      await app.request('/api/support/threads', { headers: { cookie: supportAgent.cookie } })
    ).json()) as SupportThreadSummary[]
    expect(inbox.map((item) => item.id)).toContain(thread.id)
    expect((await findQueuedEmails(supportAgent.email)).length).toBeGreaterThan(0)
  })

  it('keeps threads private to the client account', async () => {
    const thread = await openThread()
    expect((await getThread(thread.id, outsider.cookie)).status).toBe(404)
    const list = (await (
      await app.request('/api/support/threads', { headers: { cookie: outsider.cookie } })
    ).json()) as SupportThreadSummary[]
    expect(list.map((item) => item.id)).not.toContain(thread.id)
  })

  it('refuses requests about products the client is not entitled to', async () => {
    const other = await createProductWithRevisions(admin.cookie, [])
    const res = await app.request(
      '/api/support/threads',
      jsonRequest(
        'POST',
        { productId: other.id, subject: 'Hello there', body: 'Hi' },
        client.cookie,
      ),
    )
    expect(res.status).toBe(404)
  })

  it('moves the status with each side and emails the client on vendor replies', async () => {
    const thread = await openThread()
    const vendorReply = await reply(thread.id, { body: 'Try bootloader 1.4.' }, supportAgent.cookie)
    expect(((await vendorReply.json()) as SupportThread).status).toBe('waiting_on_client')
    const clientMail = await findQueuedEmails(client.email)
    expect(clientMail.some((mail) => mail.text.includes('Try bootloader 1.4.'))).toBe(true)

    const clientReply = await reply(thread.id, { body: 'That fixed it.' }, client.cookie)
    expect(((await clientReply.json()) as SupportThread).status).toBe('open')
  })

  it('hides internal notes from clients, in the thread and by email', async () => {
    const thread = await openThread()
    await reply(
      thread.id,
      { body: 'Known issue, see ticket 42', internal: true },
      supportAgent.cookie,
    )

    const asClient = (await (await getThread(thread.id, client.cookie)).json()) as SupportThread
    expect(asClient.messages.map((message) => message.body)).not.toContain(
      'Known issue, see ticket 42',
    )
    const asVendor = (await (await getThread(thread.id, admin.cookie)).json()) as SupportThread
    expect(asVendor.messages.some((message) => message.internal)).toBe(true)

    const mail = await findQueuedEmails(client.email)
    expect(mail.some((item) => item.text.includes('ticket 42'))).toBe(false)
    expect((await reply(thread.id, { body: 'sneaky', internal: true }, client.cookie)).status).toBe(
      403,
    )
  })

  it('attaches uploaded files that only the thread participants can download', async () => {
    const bytes = new TextEncoder().encode('serial log')
    const started = await app.request(
      '/api/support/attachments',
      jsonRequest('POST', { fileName: 'boot.log', sizeBytes: bytes.byteLength }, client.cookie),
    )
    const upload = (await started.json()) as SupportAttachmentUpload
    await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.uploadHeaders, body: bytes })

    const res = await app.request(
      '/api/support/threads',
      jsonRequest(
        'POST',
        {
          productId,
          subject: 'Log attached',
          body: 'See log',
          attachmentIds: [upload.attachmentId],
        },
        client.cookie,
      ),
    )
    const thread = (await res.json()) as SupportThread
    expect(thread.messages[0]?.attachments.map((file) => file.fileName)).toEqual(['boot.log'])

    const download = (cookie: string) =>
      app.request(`/api/support/attachments/${upload.attachmentId}/download`, {
        headers: { cookie },
      })
    expect((await download(supportAgent.cookie)).status).toBe(302)
    expect((await download(outsider.cookie)).status).toBe(404)
  })

  it('refuses to attach a file uploaded by someone else', async () => {
    const started = await app.request(
      '/api/support/attachments',
      jsonRequest('POST', { fileName: 'x.log', sizeBytes: 1 }, outsider.cookie),
    )
    const upload = (await started.json()) as SupportAttachmentUpload
    const res = await app.request(
      '/api/support/threads',
      jsonRequest(
        'POST',
        { productId, subject: 'Stolen file', body: 'x', attachmentIds: [upload.attachmentId] },
        client.cookie,
      ),
    )
    expect(res.status).toBe(422)
  })
})
