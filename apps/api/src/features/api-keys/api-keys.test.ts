import type { ApiKey, CreatedApiKey } from '@entitled/contracts/api-keys'
import type { ArtifactUpload, Release } from '@entitled/contracts/releases'
import { auditLog, users } from '@entitled/db/schema'
import { and, eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'
import { db } from '#lib/db.ts'
import { createProductWithRevisions } from '#test/catalog-fixtures.ts'
import { markArtifactReady } from '#test/release-fixtures.ts'
import { createSignedInUser, jsonRequest } from '#test/test-users.ts'

describe('CI API keys', () => {
  const app = createApp()
  let admin: Awaited<ReturnType<typeof createSignedInUser>>

  beforeAll(async () => {
    admin = await createSignedInUser({ vendorRole: 'admin' })
  })

  async function createKey(cookie = admin.cookie) {
    const res = await app.request(
      '/api/api-keys',
      jsonRequest('POST', { name: 'GitLab CI' }, cookie),
    )
    expect(res.status).toBe(201)
    return (await res.json()) as CreatedApiKey
  }

  const withKey = (key: string, init: RequestInit = {}): RequestInit => ({
    ...init,
    headers: { ...(init.headers as Record<string, string>), authorization: `Bearer ${key}` },
  })

  it('shows the secret once and lists keys without it', async () => {
    const created = await createKey()
    expect(created.key).toMatch(/^ent_/)

    const list = await app.request('/api/api-keys', { headers: { cookie: admin.cookie } })
    const keys = (await list.json()) as (ApiKey & { key?: string })[]
    const listed = keys.find((key) => key.id === created.id)
    expect(listed?.ownerEmail).toBe(admin.email)
    expect(listed).not.toHaveProperty('key')
  })

  it('runs the whole CI flow: find product, create release, upload, publish', async () => {
    const { key, id: apiKeyId } = await createKey()
    const product = await createProductWithRevisions(admin.cookie, ['A'])

    const found = await app.request(`/api/products?slug=${product.slug}`, withKey(key))
    expect(((await found.json()) as { id: string }[]).map((item) => item.id)).toEqual([product.id])

    const created = await app.request(
      '/api/releases',
      withKey(key, jsonRequest('POST', { productId: product.id, version: '4.0.0' })),
    )
    expect(created.status).toBe(201)
    const release = (await created.json()) as Release

    const bytes = new TextEncoder().encode('ci build')
    const started = await app.request(
      `/api/releases/${release.id}/artifacts`,
      withKey(key, jsonRequest('POST', { fileName: 'app.hex', sizeBytes: bytes.byteLength })),
    )
    const upload = (await started.json()) as ArtifactUpload
    await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.uploadHeaders, body: bytes })
    const completed = await app.request(
      `/api/artifacts/${upload.artifact.id}/complete`,
      withKey(key, { method: 'POST' }),
    )
    expect(completed.status).toBe(200)

    await markArtifactReady(upload.artifact.id)
    const published = await app.request(
      `/api/releases/${release.id}/publish`,
      withKey(key, { method: 'POST' }),
    )
    expect(published.status).toBe(200)

    const audit = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.action, 'release.published'), eq(auditLog.subjectId, release.id)))
    expect(audit[0]).toMatchObject({ actorUserId: admin.id, actorApiKeyId: apiKeyId })
  })

  it('cannot reach anything outside the release API', async () => {
    const { key } = await createKey()
    expect((await app.request('/api/client-accounts', withKey(key))).status).toBe(403)
    expect(
      (await app.request('/api/api-keys', withKey(key, jsonRequest('POST', { name: 'x' })))).status,
    ).toBe(403)
  })

  it('stops working once revoked', async () => {
    const { key, id } = await createKey()
    const revoked = await app.request(`/api/api-keys/${id}`, {
      method: 'DELETE',
      headers: { cookie: admin.cookie },
    })
    expect(revoked.status).toBe(204)
    expect((await app.request('/api/products', withKey(key))).status).toBe(401)
  })

  it('stops working when its owner is no longer vendor staff', async () => {
    const owner = await createSignedInUser({ vendorRole: 'admin' })
    const { key } = await createKey(owner.cookie)
    await db.update(users).set({ vendorRole: null }).where(eq(users.id, owner.id))
    expect((await app.request('/api/products', withKey(key))).status).toBe(401)
  })

  it('rejects unknown keys', async () => {
    expect((await app.request('/api/products', withKey('ent_not-a-real-key'))).status).toBe(401)
  })
})
