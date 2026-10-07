import type { ArtifactUpload, Release } from '@entitled/contracts/releases'
import { artifacts } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import { expect } from 'vitest'
import { createApp } from '#app.ts'
import { db } from '#lib/db.ts'
import { jsonRequest } from './test-users.ts'

export async function createReleaseFor(cookie: string, productId: string, body: object = {}) {
  const res = await createApp().request(
    '/api/releases',
    jsonRequest('POST', { productId, version: `1.${String(Date.now())}`, ...body }, cookie),
  )
  expect(res.status).toBe(201)
  return (await res.json()) as Release
}

export async function changeStatus(cookie: string, releaseId: string, action: string) {
  return createApp().request(
    `/api/releases/${releaseId}/${action}`,
    jsonRequest('POST', {}, cookie),
  )
}

// Uploads bytes the way a browser or CI would: presigned PUT, then completion.
export async function uploadArtifact(cookie: string, releaseId: string, content: string) {
  const app = createApp()
  const bytes = new TextEncoder().encode(content)
  const started = await app.request(
    `/api/releases/${releaseId}/artifacts`,
    jsonRequest('POST', { fileName: 'firmware.bin', sizeBytes: bytes.byteLength }, cookie),
  )
  expect(started.status).toBe(201)
  const upload = (await started.json()) as ArtifactUpload
  const put = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: upload.uploadHeaders,
    body: bytes,
  })
  expect(put.status).toBe(200)
  const completed = await app.request(
    `/api/artifacts/${upload.artifact.id}/complete`,
    jsonRequest('POST', {}, cookie),
  )
  return { artifactId: upload.artifact.id, completed }
}

// Stands in for the worker's checksum job, which does not run inside API tests.
export async function markArtifactReady(artifactId: string) {
  await db
    .update(artifacts)
    .set({ status: 'ready', sha256: 'a'.repeat(64) })
    .where(eq(artifacts.id, artifactId))
}
