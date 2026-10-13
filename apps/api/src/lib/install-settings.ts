import { type Branding, brandColorSchema, type InstallSettings } from '@entitled/contracts/settings'
import type { Queryable } from '@entitled/db'
import { installSettings } from '@entitled/db/schema'

async function loadRow(db: Queryable) {
  const [row] = await db
    .select({
      autoPublishReleases: installSettings.autoPublishReleases,
      portalName: installSettings.portalName,
      primaryColor: installSettings.primaryColor,
      logoContentType: installSettings.logoContentType,
      updatedAt: installSettings.updatedAt,
    })
    .from(installSettings)
  return row
}

export async function getInstallSettings(db: Queryable): Promise<InstallSettings> {
  const row = await loadRow(db)
  return { autoPublishReleases: row?.autoPublishReleases ?? false }
}

export async function getBranding(db: Queryable): Promise<Branding> {
  const row = await loadRow(db)
  const color = brandColorSchema.safeParse(row?.primaryColor)
  return {
    portalName: row?.portalName ?? 'Entitled',
    primaryColor: color.success ? color.data : 'indigo',
    logoUrl: row?.logoContentType
      ? `/api/branding/logo?v=${String(row.updatedAt.getTime())}`
      : null,
  }
}
