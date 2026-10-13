import type { Branding, UpdateBrandingInput } from '@entitled/contracts/settings'
import { installSettings } from '@entitled/db/schema'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { getBranding } from '#lib/install-settings.ts'
import type { TransactionScope } from '#lib/transaction.ts'

type BrandingChange = UpdateBrandingInput & {
  logo?: { bytes: Buffer; contentType: string } | null
}

export async function updateBranding(
  { tx }: TransactionScope,
  actor: Actor,
  change: BrandingChange,
): Promise<Branding> {
  const { logo, ...fields } = change
  const set = {
    ...fields,
    ...(logo === undefined
      ? {}
      : { logo: logo?.bytes ?? null, logoContentType: logo?.contentType ?? null }),
    updatedAt: new Date(),
  }
  await tx
    .insert(installSettings)
    .values({ id: 1, ...set })
    .onConflictDoUpdate({ target: installSettings.id, set })

  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'branding.updated',
    subjectType: 'settings',
    subjectId: null,
    metadata: { ...fields, logo: logo === undefined ? 'unchanged' : logo ? 'replaced' : 'removed' },
  })
  return getBranding(tx)
}
