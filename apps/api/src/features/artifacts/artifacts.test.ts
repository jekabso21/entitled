import { auditLog } from '@entitled/db/schema'
import { and, eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { db } from '#lib/db.ts'
import { createProductWithRevisions } from '#test/catalog-fixtures.ts'
import {
  changeStatus,
  createReleaseFor,
  markArtifactReady,
  uploadArtifact,
} from '#test/release-fixtures.ts'
import { createClientAccountWith, createSignedInUser, jsonRequest } from '#test/test-users.ts'

describe('artifacts', () => {
  const app = createApp()
  let adminCookie: string
  let client: Awaited<ReturnType<typeof createSignedInUser>>
  let clientAccountId: string

  beforeAll(async () => {
    adminCookie = (await createSignedInUser({ vendorRole: 'admin' })).cookie
    client = await createSignedInUser()
    clientAccountId = await createClientAccountWith(client.id, 'member')
  })

  async function draftRelease(entitled = true) {
    const product = await createProductWithRevisions(adminCookie, [])
    if (entitled) {
      await app.request(
        '/api/entitlements',
        jsonRequest('POST', { clientAccountId, productId: product.id }, adminCookie),
      )
    }
    return createReleaseFor(adminCookie, product.id)
  }

  const download = (artifactId: string, cookie: string) =>
    app.request(`/api/artifacts/${artifactId}/download`, { headers: { cookie } })

  it('uploads through a presigned URL and serves the bytes to an entitled client', async () => {
    const release = await draftRelease()
    const { artifactId, completed } = await uploadArtifact(adminCookie, release.id, 'firmware v1')
    expect(await completed.json()).toEqual({ status: 'processing' })

    expect((await changeStatus(adminCookie, release.id, 'publish')).status).toBe(422)
    await markArtifactReady(artifactId)
    expect((await changeStatus(adminCookie, release.id, 'publish')).status).toBe(200)

    const res = await download(artifactId, client.cookie)
    expect(res.status).toBe(302)
    const file = await fetch(res.headers.get('location') ?? '')
    expect(await file.text()).toBe('firmware v1')

    const audit = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.action, 'artifact.downloaded'), eq(auditLog.subjectId, artifactId)))
    expect(audit).toHaveLength(1)
    expect(audit[0]?.actorUserId).toBe(client.id)
  })

  it('hides files of drafts and of products the client is not entitled to', async () => {
    const draft = await draftRelease()
    const inDraft = await uploadArtifact(adminCookie, draft.id, 'draft')
    await markArtifactReady(inDraft.artifactId)
    expect((await download(inDraft.artifactId, client.cookie)).status).toBe(404)

    const foreign = await draftRelease(false)
    const notEntitled = await uploadArtifact(adminCookie, foreign.id, 'secret')
    await markArtifactReady(notEntitled.artifactId)
    await changeStatus(adminCookie, foreign.id, 'publish')
    expect((await download(notEntitled.artifactId, client.cookie)).status).toBe(404)
  })

  it('hides files of a release meant for other client accounts', async () => {
    const release = await draftRelease()
    const otherAccountId = await createClientAccountWith((await createSignedInUser()).id, 'admin')
    const { artifactId } = await uploadArtifact(adminCookie, release.id, 'private build')
    await markArtifactReady(artifactId)
    await app.request(
      `/api/releases/${release.id}`,
      jsonRequest(
        'PATCH',
        { audience: 'selected', clientAccountIds: [otherAccountId] },
        adminCookie,
      ),
    )
    await changeStatus(adminCookie, release.id, 'publish')
    expect((await download(artifactId, client.cookie)).status).toBe(404)
  })

  it('refuses to complete an upload whose bytes never arrived', async () => {
    const release = await draftRelease()
    const started = await app.request(
      `/api/releases/${release.id}/artifacts`,
      jsonRequest('POST', { fileName: 'missing.bin', sizeBytes: 10 }, adminCookie),
    )
    const { artifact } = (await started.json()) as { artifact: { id: string } }
    const completed = await app.request(
      `/api/artifacts/${artifact.id}/complete`,
      jsonRequest('POST', {}, adminCookie),
    )
    expect(completed.status).toBe(422)
  })

  it('rejects file names that try to escape the release folder', async () => {
    const release = await draftRelease()
    const res = await app.request(
      `/api/releases/${release.id}/artifacts`,
      jsonRequest('POST', { fileName: '../escape.bin', sizeBytes: 1 }, adminCookie),
    )
    expect(res.status).toBe(422)
  })

  it('removes files only while the release is a draft', async () => {
    const release = await draftRelease()
    const first = await uploadArtifact(adminCookie, release.id, 'one')
    const second = await uploadArtifact(adminCookie, release.id, 'two')
    await markArtifactReady(first.artifactId)
    await markArtifactReady(second.artifactId)

    const removeFirst = await app.request(`/api/artifacts/${first.artifactId}`, {
      method: 'DELETE',
      headers: { cookie: adminCookie },
    })
    expect(removeFirst.status).toBe(204)

    await changeStatus(adminCookie, release.id, 'publish')
    const removeSecond = await app.request(`/api/artifacts/${second.artifactId}`, {
      method: 'DELETE',
      headers: { cookie: adminCookie },
    })
    expect(removeSecond.status).toBe(422)
  })
})
