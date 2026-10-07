import { db } from '#lib/db.ts'
import { findRelease } from './release-queries.ts'

// Mutations answer with the vendor view of the release they changed.
export async function loadReleaseForVendor(releaseId: string) {
  const release = await findRelease(db, { kind: 'all' }, releaseId)
  if (!release) throw new Error(`Release ${releaseId} vanished after a write`)
  return release
}
