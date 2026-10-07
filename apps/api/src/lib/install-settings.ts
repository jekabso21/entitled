import type { InstallSettings } from '@entitled/contracts/settings'
import type { Queryable } from '@entitled/db'
import { installSettings } from '@entitled/db/schema'

export async function getInstallSettings(db: Queryable): Promise<InstallSettings> {
  const [row] = await db.select().from(installSettings)
  return { autoPublishReleases: row?.autoPublishReleases ?? false }
}
