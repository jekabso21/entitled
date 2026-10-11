import type { InstallSettings, UpdateInstallSettingsInput } from '@entitled/contracts/settings'
import { installSettings } from '@entitled/db/schema'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { getInstallSettings } from '#lib/install-settings.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function updateSettings(
  { tx }: TransactionScope,
  actor: Actor,
  input: UpdateInstallSettingsInput,
): Promise<InstallSettings> {
  const current = await getInstallSettings(tx)
  const next: InstallSettings = {
    autoPublishReleases: input.autoPublishReleases ?? current.autoPublishReleases,
  }
  await tx
    .insert(installSettings)
    .values({ id: 1, ...next })
    .onConflictDoUpdate({ target: installSettings.id, set: next })
  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'settings.updated',
    subjectType: 'settings',
    subjectId: null,
    metadata: input,
  })
  return next
}
